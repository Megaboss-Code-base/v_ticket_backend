import { Request, Response } from "express";
import { EventInstance } from "../models/eventModel";
import { TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import { JwtPayload } from "jsonwebtoken";
import sendEmail from "../utilities/sendMail";

export const getEventTickets = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const userId = req.user;

  try {
    const event = await EventInstance.findOne({
      where: { id: eventId, userId },
    });
    if (!event)
      return res
        .status(404)
        .json({ error: "Event not found or you are not the event owner" });

    const tickets = await TicketInstance.findAll({ where: { eventId } });

    return res.status(200).json({ counts: tickets.length, tickets });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to fetch tickets", details: error.message });
  }
};

export const purchaseTicket = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const { ticketType, currency, email, phone, fullName } = req.body;

  if (!email || !phone || !fullName) {
    return res.status(400).json({ error: "Provide all the required fields" });
  }

  try {
    const event = await EventInstance.findOne({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    if (new Date() > new Date(event.date)) {
      return res
        .status(400)
        .json({ error: "Cannot purchase tickets for expired events" });
    }

    const ticketInfo = event.ticketType.find(
      (ticket) => ticket.name === ticketType
    );
    if (!ticketInfo) {
      return res.status(400).json({ error: "Invalid ticket type" });
    }

    const ticketPrice = parseFloat(ticketInfo.price);
    const ticketId = uuidv4();
    const qrCodeData = {
      ticketId,
      email,
      phone,
      fullName,
      eventId: event.id,
      ticketType,
      price: ticketPrice,
      purchaseDate: new Date(),
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));

    const newTicket = await TicketInstance.create({
      id: ticketId,
      email,
      phone,
      fullName,
      eventId: event.id,
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
      title: "Ticket Created",
      message: `A ${ticketType} ticket for the event "${event.title}" has been created.`,
      userId: event.userId,
      isRead: false,
    });

    const mailSubject = `Your Ticket for "${event.title}"`;
    const mailMessage = `
      Dear ${fullName},
      
      Thank you for purchasing a ${ticketType} ticket for the event "${event.title}".
      Here are your ticket details:
      
      - Event: ${event.title}
      - Ticket Type: ${ticketType}
      - Price: ${currency} ${ticketPrice}
      - Date: ${new Date(event.date).toLocaleDateString()}
      
      Please find your ticket QR code below. Complete your payment to confirm the ticket.

      Best regards,
      The Event Team
    `;

    await sendEmail({
      email,
      subject: mailSubject,
      message: mailMessage,
      attachments: [
        {
          filename: "ticket-qr-code.png",
          content: qrCode.split(",")[1],
          encoding: "base64",
        },
      ],
    });

    return res.status(201).json({
      message: "Ticket created successfully. An email has been sent to confirm.",
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
  req: Request,
  res: Response
): Promise<any> => {
  const { ticketId } = req.params;

  try {
    const ticket = await TicketInstance.findOne({ where: { id: ticketId } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    await ticket.destroy();
    return res.status(200).json({ message: "Ticket canceled successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to cancel ticket", details: error.message });
  }
};
