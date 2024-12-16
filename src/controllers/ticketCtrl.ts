import { Request, Response } from "express";
import {  EventInstance } from "../models/eventModel";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import { JwtPayload } from "jsonwebtoken";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import axios from "axios";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL2 = "https://api.paystack.co";
const FRONTEND_URL = process.env.FRONTEND_URL;

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
      return res.status(400).json({ error: "Cannot purchase tickets for expired events" });

    const ticket = event.ticketType.find((ticket) => ticket.name === ticketType);
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

export const processPayment = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;
  const { ticketId } = req.params;

  try {
    const ticket = await TicketInstance.findOne({ where: { id: ticketId } }) as unknown as TicketAttribute;
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    if (ticket.paid) {
      return res.status(400).json({ error: "Ticket has already been paid for" });
    }

    const user = await UserInstance.findOne({ where: { id: userId } }) as unknown as UserAttribute;
    if (!user) return res.status(404).json({ error: "User not found" });

    const event = await EventInstance.findOne({ where: { id: ticket.eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const paymentPayload = {
      amount: ticket.price * 100,
      email: user.email,
      reference: ticket.id,
      callback_url: `${FRONTEND_URL}/tickets/callback`,
    };

    const paymentResponse = await initializePayment(paymentPayload);

    return res.status(200).json({
      message: "Payment initiated. Please complete the payment.",
      paymentLink: paymentResponse.data.authorization_url,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to initiate payment",
      details: error.message,
    });
  }
};

export const paymentCallback = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { transaction_id, tx_ref, status } = req.query;

  try {
    if (status !== "successful") {
      return res.status(400).json({ error: "Payment failed" });
    }

    const ticket = await TicketInstance.findOne({ where: { id: tx_ref as string } })as unknown as TicketAttribute;
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    await TicketInstance.update(
      { paid: true, validationStatus: "Valid" },
      { where: { id: tx_ref as string } }
    );

    const event = await EventInstance.findOne({ where: { id: ticket.eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const updatedTicketType = event.ticketType.map((eventTicket) => {
      if (eventTicket.name === ticket.ticketType) {
        const updatedQuantity = parseInt(eventTicket.quantity, 10) - 1;
        const updatedSold = parseInt(eventTicket.sold, 10) + 1;
        return { ...eventTicket, quantity: updatedQuantity.toString(), sold: updatedSold.toString() };
      }
      return eventTicket;
    });

    await EventInstance.update(
      { ticketType: updatedTicketType },
      { where: { id: event.id } }
    );

    return res.status(200).json({ message: "Payment successful and ticket confirmed" });
  } catch (error: any) {
    return res.status(500).json({
      error: "Payment callback processing failed",
      details: error.message,
    });
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
    }));

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

const initializePayment = async (payload: {
  amount: number;
  email: string;
  reference: string;
  callback_url: string;
}) => {
  try {
    const response = await axios.post(
      `${BASE_URL2}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || "Payment initialization failed"
    );
  }
};

export const verifyPayment = async (reference: string) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY!}`,
        },
      }
    );
    return response.data;
  } catch (error:any) {
    console.error("Payment verification error:", error.response?.data || error);
    throw new Error("Payment verification failed");
  }
};