import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { EventInstance } from "../models/eventModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import { JwtPayload } from "jsonwebtoken";
import slugify from "slugify";
import { v2 as cloudinary } from "cloudinary";

import {
  eventValidationSchema,
  updateEventValidationSchema,
} from "../utilities/validation";
import { Op, Sequelize } from "sequelize";

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

export const deleteExpiredEvents = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const deleted = await EventInstance.destroy({
      where: {
        date: {
          [Op.lt]: threeDaysAgo,
        },
      },
    });

    console.log(`${deleted} expired events deleted.`);
  } catch (error) {
    console.error("Error deleting expired events:", error);
  }
};

export const getTrendingEvents = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const trendingEvents = await EventInstance.findAll({
      where: {
        date: {
          [Op.gte]: new Date(),
        },
      },
      order: [["date", "ASC"]],
    });
    return res.status(200).json({
      counts: trendingEvents.length,
      events: trendingEvents,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error fetching events", error: error.message });
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

    if (event.image) {
      const imagePublicId = event.image
        .split("/")
        .slice(-2)
        .join("/")
        .split(".")[0];
      if (imagePublicId) {
        const result = await cloudinary.uploader.destroy(imagePublicId);
        console.log(result);

        if (result.result === "ok") {
          console.log("Image deleted successfully.");
        } else {
          console.warn("Failed to delete image:", result);
        }
      } else {
        console.warn("No public ID found for the image.");
      }
    } else {
      console.warn("No image URL found for the event.");
    }
    await event.destroy();

    return res
      .status(200)
      .json({ message: "Event and image deleted successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error deleting event", error: error.message });
  }
};

export const createEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { socialMediaLinks } = req.body;
  const userId = req.user;
  const user = (await UserInstance.findOne({
    where: { id: userId },
  })) as unknown as UserAttribute;

  if (!user) {
    return res.status(404).json({ message: "Please log in to create an event" });
  }

  let galleryUrls: string[] = [];
  let fileUrl: string | undefined = undefined;
  
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

    const { title, description, date, venue, location, time } =
      validateResult.value;

    if (req.files && Array.isArray(req.files)) {
      for (let file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path);
        galleryUrls.push(uploadResult.secure_url);
      }
    }

    fileUrl = galleryUrls[0]; 

    let socialMediaLinksObject: { [key: string]: string } | null = null;
    if (socialMediaLinks) {
      try {
        socialMediaLinksObject = JSON.parse(socialMediaLinks);
      } catch (error) {
        return res.status(400).json({
          message: "Invalid format for social media links. Please send as a JSON object.",
        });
      }
    }

    const newEvent = await EventInstance.create({
      id: uuidv4(),
      title,
      slug: slugify(String(title)),
      description,
      image: fileUrl,
      date,
      time,
      venue,
      location,
      ticketType: updatedTicketTypes,
      userId,
      gallery: galleryUrls,
      socialMediaLinks: socialMediaLinksObject,
      hostName: user.fullName,
    });

    return res.status(201).json({ message: "Event created successfully", event: newEvent });

  } catch (error: any) {
    if (galleryUrls.length > 0) {
      for (const url of galleryUrls) {
        const publicId = url.split('/').pop()?.split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }
    return res.status(500).json({ message: "Error creating event", error: error.message });
  }
};