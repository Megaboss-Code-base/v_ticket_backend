import { Request, Response } from "express";
import { EventInstance } from "../models/eventModel";
import { TicketInstance } from "../models/ticketModel";
import { JwtPayload } from "jsonwebtoken";
import { ModeratorInstance } from "../models/moderatorModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import sharp from "sharp";
import { verifyTicketSignature } from "../config";

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
  const { ticketId, signature } = req.query;

  if (!ticketId || !signature) {
    return res
      .status(400)
      .json({ message: "Ticket ID and signature are required" });
  }

  if (!verifyTicketSignature(ticketId as string, signature as string)) {
    return res.status(403).json({ message: "Invalid QR code signature" });
  }

  try {
    const ticket = await TicketInstance.findOne({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (ticket.isScanned === true) {
      return res.status(200).json({
        message: "Ticket already scanned",
        ticket,
      });
    }

    ticket.isScanned = true;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket successfully validated",
      ticket,
    });
  } catch (error: any) {
    console.error("Error validating ticket:", error);
    return res.status(500).json({
      message: "An error occurred while validating the ticket",
      error: error.message,
    });
  }
};

export const deleteAllTickets = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const deletedCount = await TicketInstance.destroy({
      where: {},
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        message: "No tickets found to delete",
      });
    }

    return res.status(200).json({
      message: "All tickets have been successfully deleted",
      deletedCount,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "An error occurred while deleting tickets",
      details: error.message,
    });
  }
};

export const getTicketById = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { ticketId } = req.params;

  try {
    const ticket = await TicketInstance.findOne({ where: { id: ticketId } });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    return res.status(200).json({ ticket });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to fetch tickets", details: error.message });
  }
};
