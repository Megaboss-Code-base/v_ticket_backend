import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { EventInstance } from "../models/eventModel";
import { UserInstance } from "../models/userModel";
import { JwtPayload } from "jsonwebtoken";
import {
  eventValidationSchema,
  updateEventValidationSchema,
} from "../utilities/validation";
import { Sequelize } from "sequelize";

export const createEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;
  const fileUrl = req.file?.path;

  if (!userId) {
    return res
      .status(404)
      .json({ message: "Please log in to create an event" });
  }

  if (!fileUrl) {
    return res.status(404).json({ message: "Please provide an image" });
  }

  try {
    const validateResult = eventValidationSchema.validate(req.body);

    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    const { ticketType } = validateResult.value;
    const ticketTypeArray = JSON.parse(ticketType);

    const updatedTicketTypes = ticketTypeArray.map((ticket: any) => ({
      ...ticket,
      sold: "0",
    }));

    const { title, description, date, location } = validateResult.value;

    const newEvent = await EventInstance.create({
      id: uuidv4(),
      title,
      description,
      image: fileUrl,
      date,
      location,
      ticketType: updatedTicketTypes,
      userId,
    });

    return res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error creating event", error: error.message });
  }
};

export const getAllEvents = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const events = await EventInstance.findAll();
    return res.status(200).json({ counts: events.length, events });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error fetching events", error: error.message });
  }
};

export const getEventById = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const event = await EventInstance.findOne({
      where: {
        id: id,
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({ event });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error fetching event", error: error.message });
  }
};

export const getAllMyEvents = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const events = await EventInstance.findAll({
      where: {
        userId: req.user,
      },
    });

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found for this user" });
    }

    return res.status(200).json({ counts: events.length, events });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error fetching events", error: error.message });
  }
};

export const updateEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const { error, value } = updateEventValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: "Validation Error",
        error: error.details[0].message,
      });
    }

    const { title, description, date, location, ticketType } = value;

    const event = await EventInstance.findOne({
      where: {
        id,
        userId: req.user,
      },
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or User not authorized",
      });
    }

    if (
      event.ticketType &&
      event.ticketType.some((ticket: any) => parseInt(ticket.sold) > 0)
    ) {
      if (ticketType) {
        return res.status(400).json({
          message:
            "Cannot update ticketType because some tickets have been sold",
        });
      }
    }

    const updatedData: any = {};

    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (req.file?.path) updatedData.image = req.file?.path;
    if (date) updatedData.date = date;
    if (location) updatedData.location = location;

    if (ticketType) {
      try {
        const ticketTypeArray =
          typeof ticketType === "string" ? JSON.parse(ticketType) : ticketType;

        if (Array.isArray(ticketTypeArray)) {
          updatedData.ticketType = ticketTypeArray.map((ticket: any) => ({
            ...ticket,
            sold: "0",
          }));
        } else {
          return res.status(400).json({ Error: "Invalid ticketType format" });
        }
      } catch (err) {
        return res.status(400).json({ Error: "Failed to parse ticketType" });
      }
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ Error: "No valid fields to update" });
    }

    await EventInstance.update(updatedData, {
      where: { id },
    });

    const updatedEvent = await EventInstance.findOne({
      where: { id },
    });

    return res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error updating event",
      error: error.message,
    });
  }
};

export const deleteEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;

    const event = await EventInstance.findOne({
      where: {
        id: id,
        userId: req.user,
      },
    });

    if (!event) {
      return res
        .status(404)
        .json({ message: "Event not found or User not the right user" });
    }

    await event.destroy();
    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error deleting event", error: error.message });
  }
};

export const getEventsSortedBySoldQuantityRatio = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const events = await EventInstance.findAll({
      attributes: {
        include: [
          [
            Sequelize.literal(
              `(
                SELECT MAX(CAST("sold" AS FLOAT) / NULLIF("quantity", 0))
                FROM jsonb_array_elements("ticketType") AS ticket
                WHERE ticket->>'sold' IS NOT NULL AND ticket->>'quantity' IS NOT NULL
              )`
            ),
            "soldToQuantityRatio",
          ],
        ],
      },
      order: [
        [
          Sequelize.literal(
            `(
              SELECT MAX(CAST("sold" AS FLOAT) / NULLIF("quantity", 0))
              FROM jsonb_array_elements("ticketType") AS ticket
              WHERE ticket->>'sold' IS NOT NULL AND ticket->>'quantity' IS NOT NULL
            )`
          ),
          "DESC",
        ],
      ],
    });

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found" });
    }

    return res.status(200).json({
      counts: events.length,
      events: events.map((event) => event.get({ plain: true })),
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Error fetching events",
      error: error.message,
    });
  }
};
