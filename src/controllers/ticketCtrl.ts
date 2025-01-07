import { Request, Response } from "express";
import { EventInstance } from "../models/eventModel";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import { JwtPayload } from "jsonwebtoken";
import sendEmail from "../utilities/sendMail";
import { ModeratorInstance } from "../models/moderatorModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import sharp from "sharp";
import axios from "axios";

const generateReference = () => `unique-ref-${Date.now()}`;

// @ts-ignore
const QRCodeReader = require("qrcode-reader");

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
export const validateTicket = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const moderatorId = req.user;
  const file = req.file;

  try {
    const isUser = (await UserInstance.findOne({
      where: { id: moderatorId },
    })) as unknown as UserAttribute;

    const isModerator = await ModeratorInstance.findOne({
      where: { eventId, userEmail: isUser.email },
    });

    if (!isModerator) {
      return res.status(403).json({
        error: "You are not authorized to validate tickets for this event.",
      });
    }

    if (!file) {
      return res.status(400).json({ error: "QR code image is required." });
    }

    const imageBuffer = await sharp(file.path).resize(300, 300).toBuffer();

    const { width, height } = await sharp(imageBuffer).metadata();
    if (!width || !height) {
      return res.status(400).json({ error: "Invalid image format." });
    }

    const qr = new QRCodeReader();
    const decodedData = await new Promise<string>((resolve, reject) => {
      qr.callback = (err: any, value: any) => {
        if (err) return reject(err);
        resolve(value.result);
      };
      qr.decode(imageBuffer); // Pass the image buffer to the QR code reader
    });

    // Parse the QR code data
    const { ticketId } = JSON.parse(decodedData);

    // Validate the ticket
    const ticket = (await TicketInstance.findOne({
      where: { id: ticketId, eventId },
    })) as unknown as TicketAttribute;

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    if (ticket.validationStatus !== "Valid") {
      return res
        .status(400)
        .json({ error: "This ticket has already been used or is invalid." });
    }

    // Update the ticket status to "Used"
    const updatedTicket = await TicketInstance.update(
      { validationStatus: "Used" },
      { where: { id: ticketId } }
    );

    return res.status(200).json({
      message: "Ticket validated successfully.",
      ticket: updatedTicket,
    });
  } catch (error: any) {
    console.error("Error validating ticket:", error); // Log the error
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

