import { Request, Response } from "express";
import { EventInstance } from "../models/eventModel";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import { JwtPayload } from "jsonwebtoken";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import axios from "axios";
import { FLUTTERWAVE_BASE_URL, FLUTTERWAVE_SECRET_KEY } from "../config";
import TransactionInstance from "../models/transactionModel";

const generateReference = () => `unique-ref-${Date.now()}`;

export const getEventTickets = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const userId = req.user;

  try {
    const event = await EventInstance.findOne({
      where: { id: eventId },
    });

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

export const purchaseTicket = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;
  const { eventId } = req.params;
  const { ticketType, currency } = req.body;

  try {
    const user = await UserInstance.findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const event = await EventInstance.findOne({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (new Date() > new Date(event.date))
      return res
        .status(400)
        .json({ error: "Cannot purchase tickets for expired events" });

    const ticket = event.ticketType.find(
      (ticket) => ticket.name === ticketType
    );
    if (!ticket) return res.status(400).json({ error: "Invalid ticket type" });

    const ticketPrice = parseFloat(ticket.price);

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
    });

    await NotificationInstance.create({
      id: uuidv4(),
      title: "Ticket Purchase Initiated",
      message: `You have successfully initiated the purchase for a ${ticketType} ticket for the event ${event.title}. Please complete payment to confirm.`,
      userId,
      isRead: false,
    });

    return res.status(201).json({
      message: "Ticket created successfully. Complete your payment to confirm.",
      ticket: newTicket,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to create ticket",
      details: error.message,
    });
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

export const handlePaymentRedirect = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { status, tx_ref, transaction_id } = req.query;

  // Ensure `tx_ref` is a string
  const txRef = typeof tx_ref === "string" ? tx_ref : null;

  if (!status || !txRef || !transaction_id) {
    return res.status(400).json({ message: "Invalid redirect data" });
  }

  try {
    // Verify the transaction using the Flutterwave API
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status === "success") {
      // Update your database based on the verification result
      const paymentStatus =
        response.data.data.status === "successful" ? "Completed" : "Failed";

      // Ensure the query works with Sequelize
      await TransactionInstance.update(
        { paymentStatus },
        { where: { id: txRef } } // Ensure `txRef` is a string
      );

      res.redirect("/payment-success-page"); // Redirect to a success page
    } else {
      res.redirect("/payment-failure-page"); // Redirect to a failure page
    }
  } catch (error: any) {
    console.error("Error verifying transaction:", error.message);
    res
      .status(500)
      .json({
        message: "Transaction verification failed",
        error: error.message,
      });
  }
};
