import { Request, Response } from "express";
import { EventAttribute, EventInstance } from "../models/eventModel";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import { JwtPayload } from "jsonwebtoken";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import { initiatePayment, verifyPayment } from "../interface/payment.dto";
import { BASE_URL, FRONTEND_URL } from "../config";
import { UserAttribute, UserInstance } from "../models/userModel";

export const purchaseTicket = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;
  const { eventId } = req.params;
  const { ticketType,currency } = req.body;

  try {
    const user = (await UserInstance.findOne({
      where: { id: userId },
    })) as unknown as UserAttribute;
    if (!user) {
      return res.status(404).json({ error: "USer not found" });
    }

    const event = (await EventInstance.findOne({
      where: { id: eventId },
    })) as unknown as EventAttribute;
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (new Date() > new Date(event.date)) {
      return res
        .status(400)
        .json({ error: "Cannot purchase tickets for expired events" });
    }

    const ticketPrice = event.ticketType[ticketType];
    if (!ticketPrice) {
      return res.status(400).json({ error: "Invalid ticket type" });
    }

    const ticketId = uuidv4();

    const qrCodeData = {
      ticketId,
      userId,
      eventId: event.id,
      ticketType,
      price: ticketPrice,
      purchaseDate: new Date(),
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));

    const newTicket = await TicketInstance.create({
      id: ticketId,
      eventId: event.id,
      userId,
      ticketType,
      price: ticketPrice,
      purchaseDate: new Date(),
      qrCode,
      paid: false,
      currency,
      validationStatus: "Invalid",
    }) as unknown as TicketAttribute;

    const notification = await NotificationInstance.create({
      id: uuidv4(),
      title: "Ticket Purchase Successful",
      message: `You have successfully purchased a ${ticketType} ticket for the event ${event.title}.`,
      userId,
      isRead: false,
    });

    const paymentLink = await initiatePayment({
      tx_ref: newTicket.id,
      amount: newTicket.price,
      currency: newTicket.currency,
      email: user.email,
      redirect_url: `${BASE_URL}/tickets/callback`,
    });

    return res.status(201).json({
      message: "Ticket created successfully",
      paymentLink,
      ticket: newTicket,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to purchase ticket", details: error.message });
  }
};

export const getUserTickets = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;

  try {
    const tickets = await TicketInstance.findAll({
      where: { userId },
    });

    return res.status(200).json({ counts: tickets.length, tickets });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to fetch tickets", details: error.message });
  }
};

export const cancelTicket = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;
  const { ticketId } = req.params;

  try {
    const ticket = await TicketInstance.findOne({
      where: { id: ticketId, userId },
    });
    if (!ticket) {
      return res
        .status(404)
        .json({ error: "Ticket not found or unauthorized" });
    }

    await ticket.destroy();
    return res.status(200).json({ message: "Ticket canceled successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to cancel ticket", details: error.message });
  }
};

export const validateTicket = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { ticketId } = req.params;
  const userId = req.user;

  if (!userId) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const ticket = (await TicketInstance.findOne({
      where: { id: ticketId },
    })) as unknown as TicketAttribute;

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.validationStatus === "Used") {
      return res
        .status(400)
        .json({ error: "This ticket has already been used." });
    }

    if (ticket.validationStatus === "Expired") {
      return res.status(400).json({ error: "This ticket is expired." });
    }

    if (ticket.validationStatus === "Invalid") {
      return res.status(400).json({ error: "This ticket is invalid." });
    }

    if (ticket.validationStatus === "Valid") {
      await TicketInstance.update(
        { validationStatus: "Used" },
        { where: { id: ticketId } }
      );

      return res
        .status(200)
        .json({ message: "Ticket validated successfully." });
    }

    return res
      .status(400)
      .json({ error: "Ticket status is unrecognized or incorrect." });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to validate the ticket", details: error.message });
  }
};

export const getEventTickets = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const userId = req.user;

  try {
    const event = (await EventInstance.findOne({
      where: { id: eventId },
    })) as unknown as EventAttribute;

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.userId !== userId) {
      return res
        .status(403)
        .json({ error: "You are not the owner of this event" });
    }

    const tickets = await TicketInstance.findAll({ where: { eventId } });

    return res.status(200).json({ counts: tickets.length, tickets });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to fetch tickets", details: error.message });
  }
};

export const paymentVerification = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { transaction_id, tx_ref } = req.query;

  try {
    // Verify payment
    const paymentData = await verifyPayment(transaction_id as string);

    if (paymentData.tx_ref === tx_ref) {
      await TicketInstance.update(
        {
          paid: true,
          validationStatus: "Valid",
          flwRef: paymentData.flw_ref,
          currency: paymentData.currency,
        },
        {
          where: { id: tx_ref },
        }
      );

      const ticket = (await TicketInstance.findOne({
        where: { id: tx_ref },
      })) as unknown as TicketAttribute;
      const event = (await EventInstance.findOne({
        where: { id: ticket?.eventId },
      })) as unknown as EventAttribute;

      if (event) {
        if (event.quantity <= 0) {
          throw new Error("Event is sold out");
        }

        await EventInstance.update(
          {
            quantity: event.quantity - 1,
            sold: event.sold + 1,
          },
          { where: { id: ticket?.eventId } }
        );
      }

      res.redirect(`${FRONTEND_URL}/payment-success`);
    } else {
      throw new Error("Transaction reference mismatch");
    }
  } catch (error) {
    console.error(error);
    res.redirect(`${FRONTEND_URL}/payment-failed`);
  }
};