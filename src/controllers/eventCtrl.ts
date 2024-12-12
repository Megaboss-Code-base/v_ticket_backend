import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { EventAttribute, EventInstance } from "../models/eventModel";
import { UserInstance } from "../models/userModel";
import { JwtPayload } from "jsonwebtoken";
import { eventValidationSchema } from "../utilities/validation";

export const createEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;

  if (!userId) {
    return res
      .status(404)
      .json({ message: "Please log in to create an event" });
  }

  try {
    const validateResult = eventValidationSchema.validate(req.body);

    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }
    const { title, description, image, date, location, price, ticketType } =
      validateResult.value;

    const newEvent = await EventInstance.create({
      id: uuidv4(),
      title,
      description,
      image,
      date,
      location,
      price,
      ticketType,
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
        userId: req.user,
      },
    });

    if (!event) {
      return res
        .status(404)
        .json({ message: "Event not found or User not the right user" });
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
    const { title, description, image, date, location, price, ticketType } =
      req.body;

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

    const updatedData: any = {};

    if (title) updatedData.title = title;
    if (description) updatedData.description = description;
    if (image) updatedData.image = image;
    if (date) updatedData.date = date;
    if (location) updatedData.location = location;
    if (price) updatedData.price = price;
    if (ticketType) updatedData.ticketType = ticketType;

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ Error: "No valid fields to update" });
    }

    await EventInstance.update(updatedData, { where: { id } });

    return res
      .status(200)
      .json({ message: "Event updated successfully", event });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error updating event", error: error.message });
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
