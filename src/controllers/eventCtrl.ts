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
import { Op } from "sequelize";
import { ModeratorInstance } from "../models/moderatorModel";
import { NotificationInstance } from "../models/notificationModel";

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

export const getEventBySlug = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { slug } = req.params;

    const event = await EventInstance.findOne({
      where: {
        slug,
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

export const assignModerator = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { eventId, userEmail } = req.body;
  const ownerId = req.user;

  try {
    const event = await EventInstance.findOne({
      where: { id: eventId, userId: ownerId },
    });
    if (!event) {
      return res.status(403).json({
        error: "You are not authorized to assign moderators for this event.",
      });
    }

    const moderator = await ModeratorInstance.create({
      id: uuidv4(),
      eventId,
      userEmail,
    });

    return res.status(201).json({
      message: "Moderator assigned successfully.",
      moderator,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { adminMessage } = req.body;

    const event = await EventInstance.findOne({ where: { id } });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    const myTitle = event.title;

    const user = (await UserInstance.findOne({
      where: { id: req.user },
    })) as unknown as UserAttribute;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (event.userId !== req.user && user.role !== "admin") {
      return res.status(403).json({
        message:
          "Access denied. Only the event owner or an admin can delete this event.",
      });
    }

    if (event.image) {
      try {
        const publicId = event.image
          .split("/upload/")[1]
          .split("/")
          .slice(1)
          .join("/")
          .split(".")[0];

        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId, {
            invalidate: true,
            resource_type: "image",
          });

          if (result.result === "not found") {
            return res.status(404).json({
              message: "Image not found on Cloudinary. Event not deleted.",
              error: result,
            });
          }

          if (result.result !== "ok") {
            return res.status(500).json({
              message: "Failed to delete associated image. Event not deleted.",
              error: result,
            });
          }
        } else {
          return res.status(400).json({
            message:
              "No valid public ID found for the image. Event not deleted.",
          });
        }
      } catch (error: any) {
        console.error("Error deleting image from Cloudinary:", error.message);
        return res.status(500).json({
          message: "Error deleting associated image. Event not deleted.",
          error: error.message,
        });
      }
    } else {
      return res.status(400).json({
        message: "No image associated with the event. Event not deleted.",
      });
    }

    await event.destroy();

    let responseMessage = "Event and associated image deleted successfully";
    if (user.role === "admin" && adminMessage) {
      responseMessage += `. Admin Message: ${adminMessage}`;

      await NotificationInstance.create({
        id: uuidv4(),
        title: `${myTitle} has been deleted`,
        message: `${responseMessage}`,
        userId: event.userId,
        isRead: false,
      });
    }

    return res.status(200).json({ message: responseMessage });
  } catch (error: any) {
    console.error("Error deleting event:", error.message);
    return res
      .status(500)
      .json({ message: "Error deleting event", error: error.message });
  }
};

export const deleteExpiredEvents = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const expiredEvents = await EventInstance.findAll({
      where: {
        date: {
          [Op.lt]: threeDaysAgo,
        },
      },
    });

    for (const event of expiredEvents) {
      const { id, title, userId } = event;

      await EventInstance.destroy({ where: { id } });
      console.log(`Event "${title}" (ID: ${id}) deleted.`);

      await NotificationInstance.create({
        id: uuidv4(),
        title: `Your event "${title}" has been deleted`,
        message: `Your event titled "${title}" was deleted because it expired.`,
        userId,
        isRead: false,
      });
    }

    console.log(`${expiredEvents.length} expired events processed.`);
  } catch (error) {
    console.error("Error deleting expired events:", error);
  }
};

export const editEventImg = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const event = await EventInstance.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or unauthorized",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path);
    const newImageUrl = uploadResult.secure_url;

    if (event.image) {
      const oldImagePublicId = event.image.split("/").pop()?.split(".")[0];
      if (oldImagePublicId) {
        await cloudinary.uploader.destroy(oldImagePublicId);
      }
    }

    await event.update({ image: newImageUrl });

    return res.status(200).json({
      message: "Event image updated successfully",
      image: newImageUrl,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error fetching events", error: error.message });
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
    return res
      .status(404)
      .json({ message: "Please log in to create an event" });
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

    const {
      ticketType,
      title,
      description,
      date,
      venue,
      location,
      time,
      isVirtual,
      virtualLink,
      virtualPassword,
    } = validateResult.value;

    if (isVirtual === true) {
      if (!virtualLink || virtualLink.trim() === "") {
        return res.status(400).json({
          message: "Please provide a valid virtual link for virtual events.",
        });
      }

      if (!virtualPassword || virtualPassword.trim() === "") {
        return res.status(400).json({
          message: "Please provide a virtual password for virtual events.",
        });
      }
    }

    const ticketTypeArray = JSON.parse(ticketType);
    const updatedTicketTypes = ticketTypeArray.map((ticket: any) => ({
      ...ticket,
      sold: "0",
    }));

    if (req.files && Array.isArray(req.files)) {
      for (let file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path);
        galleryUrls.push(uploadResult.secure_url);
      }
    }

    fileUrl = galleryUrls[0];

    if (!fileUrl) {
      if (galleryUrls.length > 0) {
        for (const url of galleryUrls) {
          const publicId = url.split("/").pop()?.split(".")[0];
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        }
      }
      return res
        .status(400)
        .json({ message: "Please provide an image for the event." });
    }

    let socialMediaLinksObject: { [key: string]: string } | null = null;
    if (socialMediaLinks) {
      try {
        socialMediaLinksObject = JSON.parse(socialMediaLinks);
      } catch (error) {
        return res.status(400).json({
          message:
            "Invalid format for social media links. Please send as a JSON object.",
        });
      }
    }

    const newEvent = await EventInstance.create({
      id: uuidv4(),
      title,
      slug: slugify(String(title)).toLowerCase(),
      description,
      image: fileUrl,
      date,
      time,
      venue,
      location,
      isVirtual,
      virtualLink,
      virtualPassword,
      ticketType: updatedTicketTypes,
      userId,
      gallery: galleryUrls,
      socialMediaLinks: socialMediaLinksObject,
      hostName: user.fullName,
    });

    return res
      .status(201)
      .json({ message: "Event created successfully", event: newEvent });
  } catch (error: any) {
    if (galleryUrls.length > 0) {
      for (const url of galleryUrls) {
        const publicId = url.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }
    return res
      .status(500)
      .json({ message: "Error creating event", error: error.message });
  }
};

export const updateEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const { id } = req.params;
  const userId = req.user;

  try {
    const user = await UserInstance.findOne({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Please log in to update an event" });
    }

    const validateResult = updateEventValidationSchema.validate(req.body);
    if (validateResult.error) {
      return res.status(400).json({
        message: "Validation Error",
        error: validateResult.error.details[0].message,
      });
    }

    const {
      title,
      description,
      date,
      time,
      venue,
      location,
      ticketType,
      socialMediaLinks,
      isVirtual,
      virtualLink,
      virtualPassword,
    } = validateResult.value;

    const event = await EventInstance.findOne({
      where: { id, userId },
    });

    if (!event) {
      return res
        .status(404)
        .json({ message: "Event not found or User not authorized" });
    }

    const updatedData: any = {};

    // Basic event info updates
    if (title) {
      updatedData.title = title;
      updatedData.slug = slugify(String(title)).toLowerCase();
    }
    if (description) updatedData.description = description;
    if (date) updatedData.date = date;
    if (time) updatedData.time = time;
    if (venue) updatedData.venue = venue;
    if (location) updatedData.location = location;

    // Virtual event updates
    if (isVirtual !== undefined) {
      updatedData.isVirtual = isVirtual;

      if (isVirtual === true) {
        if (!virtualLink || virtualLink.trim() === "") {
          return res.status(400).json({
            message: "Please provide a valid virtual link for virtual events.",
          });
        }
        if (!virtualPassword || virtualPassword.trim() === "") {
          return res.status(400).json({
            message: "Please provide a virtual password for virtual events.",
          });
        }
        updatedData.virtualLink = virtualLink;
        updatedData.virtualPassword = virtualPassword;
      } else {
        updatedData.virtualLink = null;
        updatedData.virtualPassword = null;
      }
    } else if (event.isVirtual) {
      if (!event.virtualLink || !event.virtualPassword) {
        return res.status(400).json({
          message:
            "Virtual events require both virtualLink and virtualPassword.",
        });
      }
    }

    if (ticketType) {
      try {
        const ticketTypeArray =
          typeof ticketType === "string" ? JSON.parse(ticketType) : ticketType;

        if (Array.isArray(ticketTypeArray)) {
          updatedData.ticketType = ticketTypeArray;
        } else {
          return res.status(400).json({ message: "Invalid ticketType format" });
        }
      } catch (error: any) {
        return res.status(400).json({
          message: "Failed to parse ticketType",
          error: error.message,
        });
      }
    }

    if (socialMediaLinks) {
      try {
        updatedData.socialMediaLinks =
          typeof socialMediaLinks === "string"
            ? JSON.parse(socialMediaLinks)
            : socialMediaLinks;
      } catch (error) {
        return res.status(400).json({
          message:
            "Invalid format for socialMediaLinks. Please send as a JSON object.",
        });
      }
    }

    if (req.files && Array.isArray(req.files)) {
      const existingGallery = event.gallery || [];
      const newGalleryUrls: string[] = [];

      for (const file of req.files) {
        const uploadResult = await cloudinary.uploader.upload(file.path);
        newGalleryUrls.push(uploadResult.secure_url);
      }

      updatedData.gallery = [...existingGallery, ...newGalleryUrls];
    }

    if (req.file?.path) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path);
      updatedData.image = uploadResult.secure_url;
    }

    if (Object.keys(updatedData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    await EventInstance.update(updatedData, { where: { id } });

    const updatedEvent = await EventInstance.findOne({ where: { id } });

    return res.status(200).json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error: any) {
    console.error("Error updating event:", error.message);
    return res.status(500).json({
      message: "Error updating event",
      error: error.message,
    });
  }
};
