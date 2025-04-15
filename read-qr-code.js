// change to microservice

// these are the services i have Auth Service - Handles user registration, login, password management

// Event Service - Manages events, moderators, event CRUD operations

// Ticket Service - Handles ticket purchases, validation, QR codes

// Payment Service - Processes payments via Flutterwave/Paystack

// Notification Service - Sends emails and manages notifications

// User Service - Manages user profiles and data

// src/config/index.ts import { Sequelize } from "sequelize";
// import dotenv from "dotenv";
// import crypto from "crypto";

// dotenv.config();

// const isProduction = process.env.NODE_ENV === "production";

// export const db = new Sequelize(process.env.DBCONNECTION_STRING!, {
//   logging: false,
//   dialect: "postgres",
//   dialectOptions: isProduction
//     ? {
//         ssl: {
//           require: true,
//           rejectUnauthorized: false,
//         },
//       }
//     : {
//         ssl: false,
//       },
// });

// export const URL = process.env.URL as string;
// export const port = process.env.PORT || 4000;
// export const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS!);
// export const JWT_SECRET = process.env.JWT_SECRET!;
// export const EXPIRESIN = process.env.EXPIRESIN!;
// export const REFRESH_EXPIRESIN = process.env.REFRESH_EXPIRESIN!;
// export const resetPasswordExpireMinutes = parseInt(
//   process.env.RESET_PASSWORD_EXPIRE_MINUTES!
// );
// export const resetPasswordExpireUnit = process.env
//   .RESET_PASSWORD_EXPIRE_UNIT! as string;
// export const CLOUDINARY_URL = process.env.CLOUDINARY_URL!;
// export const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY!;
// export const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
// export const BASE_URL = process.env.BASE_URL!;
// export const FRONTEND_URL = process.env.FRONTEND_URL!;
// export const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL!;
// export const ACCOUNT_ID = process.env.ACCOUNT_ID!;
// export const FLUTTERWAVE_HASH_SECRET = process.env.FLUTTERWAVE_HASH_SECRET!;
// export const ACCOUNT_OWNER_ID = process.env.ACCOUNT_OWNER_ID! as string;
// export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;
// export const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY!;
// export const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL!;
// export const SMTPEXPRESS_PROJECT_ID = process.env.SMTPEXPRESS_PROJECT_ID! as string;
// export const SMTPEXPRESS_PROJECT_SECRET = process.env.SMTPEXPRESS_PROJECT_SECRET! as string;
// export const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY! as string;
// export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY! as string;
// // export const validatePaystackWebhook = process.env.validatePaystackWebhook!;
// export function generateRandomAlphaNumeric(length: any) {
//   let result = "";
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   const charactersLength = characters.length;
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   }
//   return result;
// }

// export function generateRandomNumber(min = 8, max = 100000000000) {
//   if (max === Infinity) {
//       max = 100000000000;
//   }

//   return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// export function generateTicketSignature(ticketId: string): string {
//   const secret = process.env.TICKET_SECRET_KEY!;
//   return crypto.createHmac("sha256", secret).update(ticketId).digest("hex");
// }

// export function verifyTicketSignature(
//   ticketId: string,
//   signature: string
// ): boolean {
//   const secret = process.env.TICKET_SECRET_KEY!;
//   const expectedSignature = crypto
//     .createHmac("sha256", secret)
//     .update(ticketId)
//     .digest("hex");
//   return signature === expectedSignature;
// }

// export const validateFlutterwaveWebhook = (
//   payload: string,
//   signature: string
// ) => {
//   const hash = crypto
//     .createHmac("sha256", FLUTTERWAVE_HASH_SECRET)
//     .update(payload)
//     .digest("hex");
//   return hash === signature;
// };

// export const validatePaystackWebhook = (
//   signature: string,
//   payload: string
// ): boolean => {
//   const secretKey = process.env.PAYSTACK_SECRET_KEY; // Your Paystack secret key
//   if (!secretKey) {
//     throw new Error("PAYSTACK_SECRET_KEY is not set in environment variables");
//   }

//   const generatedHash = crypto
//     .createHmac("sha512", secretKey)
//     .update(payload)
//     .digest("hex");

//   return generatedHash === signature;
// };
// src/controllers/eventCtrl.ts import { Request, Response } from "express";
// import { v4 as uuidv4 } from "uuid";
// import { EventInstance } from "../models/eventModel";
// import { UserAttribute, UserInstance } from "../models/userModel";
// import { JwtPayload } from "jsonwebtoken";
// import slugify from "slugify";
// import { v2 as cloudinary } from "cloudinary";

// import {
//   eventValidationSchema,
//   updateEventValidationSchema,
// } from "../utilities/validation";
// import { Op } from "sequelize";
// import { ModeratorInstance } from "../models/moderatorModel";
// import { NotificationInstance } from "../models/notificationModel";

// export const getAllEvents = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const events = await EventInstance.findAll();
//     return res.status(200).json({ counts: events.length, events });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching events", error: error.message });
//   }
// };

// export const getEventById = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params;

//     const event = await EventInstance.findOne({
//       where: {
//         id: id,
//       },
//     });

//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     return res.status(200).json({ event });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching event", error: error.message });
//   }
// };

// export const getEventBySlug = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { slug } = req.params;

//     const event = await EventInstance.findOne({
//       where: {
//         slug,
//       },
//     });

//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }

//     return res.status(200).json({ event });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching event", error: error.message });
//   }
// };

// export const getAllMyEvents = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const events = await EventInstance.findAll({
//       where: {
//         userId: req.user,
//       },
//     });

//     if (!events || events.length === 0) {
//       return res.status(404).json({ message: "No events found for this user" });
//     }

//     return res.status(200).json({ counts: events.length, events });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching events", error: error.message });
//   }
// };

// export const getTrendingEvents = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const trendingEvents = await EventInstance.findAll({
//       where: {
//         date: {
//           [Op.gte]: new Date(),
//         },
//       },
//       order: [["date", "ASC"]],
//     });
//     return res.status(200).json({
//       counts: trendingEvents.length,
//       events: trendingEvents,
//     });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching events", error: error.message });
//   }
// };

// export const assignModerator = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   const { eventId, userEmail } = req.body;
//   const ownerId = req.user;

//   try {
//     const event = await EventInstance.findOne({
//       where: { id: eventId, userId: ownerId },
//     });
//     if (!event) {
//       return res.status(403).json({
//         error: "You are not authorized to assign moderators for this event.",
//       });
//     }

//     const moderator = await ModeratorInstance.create({
//       id: uuidv4(),
//       eventId,
//       userEmail,
//     });

//     return res.status(201).json({
//       message: "Moderator assigned successfully.",
//       moderator,
//     });
//   } catch (error: any) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// export const deleteEvent = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params;
//     const { adminMessage } = req.body;

//     const event = await EventInstance.findOne({ where: { id } });

//     if (!event) {
//       return res.status(404).json({ message: "Event not found" });
//     }
//     const myTitle = event.title;

//     const user = (await UserInstance.findOne({
//       where: { id: req.user },
//     })) as unknown as UserAttribute;

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (event.userId !== req.user && user.role !== "admin") {
//       return res.status(403).json({
//         message:
//           "Access denied. Only the event owner or an admin can delete this event.",
//       });
//     }

//     if (event.image) {
//       try {
//         const publicId = event.image
//           .split("/upload/")[1]
//           .split("/")
//           .slice(1)
//           .join("/")
//           .split(".")[0];

//         if (publicId) {
//           const result = await cloudinary.uploader.destroy(publicId, {
//             invalidate: true,
//             resource_type: "image",
//           });

//           if (result.result === "not found") {
//             return res.status(404).json({
//               message: "Image not found on Cloudinary. Event not deleted.",
//               error: result,
//             });
//           }

//           if (result.result !== "ok") {
//             return res.status(500).json({
//               message: "Failed to delete associated image. Event not deleted.",
//               error: result,
//             });
//           }
//         } else {
//           return res.status(400).json({
//             message:
//               "No valid public ID found for the image. Event not deleted.",
//           });
//         }
//       } catch (error: any) {
//         console.error("Error deleting image from Cloudinary:", error.message);
//         return res.status(500).json({
//           message: "Error deleting associated image. Event not deleted.",
//           error: error.message,
//         });
//       }
//     } else {
//       return res.status(400).json({
//         message: "No image associated with the event. Event not deleted.",
//       });
//     }

//     await event.destroy();

//     let responseMessage = "Event and associated image deleted successfully";
//     if (user.role === "admin" && adminMessage) {
//       responseMessage += `. Admin Message: ${adminMessage}`;

//       await NotificationInstance.create({
//         id: uuidv4(),
//         title: `${myTitle} has been deleted`,
//         message: `${responseMessage}`,
//         userId: event.userId,
//         isRead: false,
//       });
//     }

//     return res.status(200).json({ message: responseMessage });
//   } catch (error: any) {
//     console.error("Error deleting event:", error.message);
//     return res
//       .status(500)
//       .json({ message: "Error deleting event", error: error.message });
//   }
// };

// export const deleteExpiredEvents = async () => {
//   try {
//     const threeDaysAgo = new Date();
//     threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

//     const expiredEvents = await EventInstance.findAll({
//       where: {
//         date: {
//           [Op.lt]: threeDaysAgo,
//         },
//       },
//     });

//     for (const event of expiredEvents) {
//       const { id, title, userId } = event;

//       await EventInstance.destroy({ where: { id } });
//       console.log(`Event "${title}" (ID: ${id}) deleted.`);

//       await NotificationInstance.create({
//         id: uuidv4(),
//         title: `Your event "${title}" has been deleted`,
//         message: `Your event titled "${title}" was deleted because it expired.`,
//         userId,
//         isRead: false,
//       });
//     }

//     console.log(`${expiredEvents.length} expired events processed.`);
//   } catch (error) {
//     console.error("Error deleting expired events:", error);
//   }
// };

// export const editEventImg = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params;
//     const userId = req.user;

//     const event = await EventInstance.findOne({
//       where: {
//         id,
//         userId,
//       },
//     });

//     if (!event) {
//       return res.status(404).json({
//         message: "Event not found or unauthorized",
//       });
//     }

//     if (!req.file) {
//       return res.status(400).json({ message: "Please upload an image" });
//     }

//     const uploadResult = await cloudinary.uploader.upload(req.file.path);
//     const newImageUrl = uploadResult.secure_url;

//     if (event.image) {
//       const oldImagePublicId = event.image.split("/").pop()?.split(".")[0];
//       if (oldImagePublicId) {
//         await cloudinary.uploader.destroy(oldImagePublicId);
//       }
//     }

//     await event.update({ image: newImageUrl });

//     return res.status(200).json({
//       message: "Event image updated successfully",
//       image: newImageUrl,
//     });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching events", error: error.message });
//   }
// };

// export const createEvent = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   const { socialMediaLinks } = req.body;
//   const userId = req.user;
//   const user = (await UserInstance.findOne({
//     where: { id: userId },
//   })) as unknown as UserAttribute;

//   if (!user) {
//     return res
//       .status(404)
//       .json({ message: "Please log in to create an event" });
//   }

//   let galleryUrls: string[] = [];
//   let fileUrl: string | undefined = undefined;

//   try {
//     const validateResult = eventValidationSchema.validate(req.body);
//     if (validateResult.error) {
//       return res.status(400).json({
//         Error: validateResult.error.details[0].message,
//       });
//     }

//     const {
//       ticketType,
//       title,
//       description,
//       date,
//       venue,
//       location,
//       time,
//       isVirtual,
//       virtualLink,
//       virtualPassword,
//     } = validateResult.value;

//     if (isVirtual === true) {
//       if (!virtualLink || virtualLink.trim() === "") {
//         return res.status(400).json({
//           message: "Please provide a valid virtual link for virtual events.",
//         });
//       }

//       if (!virtualPassword || virtualPassword.trim() === "") {
//         return res.status(400).json({
//           message: "Please provide a virtual password for virtual events.",
//         });
//       }
//     }

//     const ticketTypeArray = JSON.parse(ticketType);
//     const updatedTicketTypes = ticketTypeArray.map((ticket: any) => ({
//       ...ticket,
//       sold: "0",
//     }));

//     if (req.files && Array.isArray(req.files)) {
//       for (let file of req.files) {
//         const uploadResult = await cloudinary.uploader.upload(file.path);
//         galleryUrls.push(uploadResult.secure_url);
//       }
//     }

//     fileUrl = galleryUrls[0];

//     if (!fileUrl) {
//       if (galleryUrls.length > 0) {
//         for (const url of galleryUrls) {
//           const publicId = url.split("/").pop()?.split(".")[0];
//           if (publicId) {
//             await cloudinary.uploader.destroy(publicId);
//           }
//         }
//       }
//       return res
//         .status(400)
//         .json({ message: "Please provide an image for the event." });
//     }

//     let socialMediaLinksObject: { [key: string]: string } | null = null;
//     if (socialMediaLinks) {
//       try {
//         socialMediaLinksObject = JSON.parse(socialMediaLinks);
//       } catch (error) {
//         return res.status(400).json({
//           message:
//             "Invalid format for social media links. Please send as a JSON object.",
//         });
//       }
//     }

//     const newEvent = await EventInstance.create({
//       id: uuidv4(),
//       title,
//       slug: slugify(String(title)).toLowerCase(),
//       description,
//       image: fileUrl,
//       date,
//       time,
//       venue,
//       location,
//       isVirtual,
//       virtualLink,
//       virtualPassword,
//       ticketType: updatedTicketTypes,
//       userId,
//       gallery: galleryUrls,
//       socialMediaLinks: socialMediaLinksObject,
//       hostName: user.fullName,
//     });

//     return res
//       .status(201)
//       .json({ message: "Event created successfully", event: newEvent });
//   } catch (error: any) {
//     if (galleryUrls.length > 0) {
//       for (const url of galleryUrls) {
//         const publicId = url.split("/").pop()?.split(".")[0];
//         if (publicId) {
//           await cloudinary.uploader.destroy(publicId);
//         }
//       }
//     }
//     return res
//       .status(500)
//       .json({ message: "Error creating event", error: error.message });
//   }
// };

// export const updateEvent = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   const { id } = req.params;
//   const userId = req.user;

//   try {
//     const user = await UserInstance.findOne({ where: { id: userId } });
//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: "Please log in to update an event" });
//     }

//     const validateResult = updateEventValidationSchema.validate(req.body);
//     if (validateResult.error) {
//       return res.status(400).json({
//         message: "Validation Error",
//         error: validateResult.error.details[0].message,
//       });
//     }

//     const {
//       title,
//       description,
//       date,
//       time,
//       venue,
//       location,
//       ticketType,
//       socialMediaLinks,
//       isVirtual,
//       virtualLink,
//       virtualPassword,
//     } = validateResult.value;

//     const event = await EventInstance.findOne({
//       where: { id, userId },
//     });

//     if (!event) {
//       return res
//         .status(404)
//         .json({ message: "Event not found or User not authorized" });
//     }

//     const updatedData: any = {};

//     // Basic event info updates
//     if (title) {
//       updatedData.title = title;
//       updatedData.slug = slugify(String(title)).toLowerCase();
//     }
//     if (description) updatedData.description = description;
//     if (date) updatedData.date = date;
//     if (time) updatedData.time = time;
//     if (venue) updatedData.venue = venue;
//     if (location) updatedData.location = location;

//     // Virtual event updates
//     if (isVirtual !== undefined) {
//       updatedData.isVirtual = isVirtual;

//       if (isVirtual === true) {
//         if (!virtualLink || virtualLink.trim() === "") {
//           return res.status(400).json({
//             message: "Please provide a valid virtual link for virtual events.",
//           });
//         }
//         if (!virtualPassword || virtualPassword.trim() === "") {
//           return res.status(400).json({
//             message: "Please provide a virtual password for virtual events.",
//           });
//         }
//         updatedData.virtualLink = virtualLink;
//         updatedData.virtualPassword = virtualPassword;
//       } else {
//         updatedData.virtualLink = null;
//         updatedData.virtualPassword = null;
//       }
//     } else if (event.isVirtual) {
//       if (!event.virtualLink || !event.virtualPassword) {
//         return res.status(400).json({
//           message:
//             "Virtual events require both virtualLink and virtualPassword.",
//         });
//       }
//     }

//     if (ticketType) {
//       try {
//         const ticketTypeArray =
//           typeof ticketType === "string" ? JSON.parse(ticketType) : ticketType;

//         if (Array.isArray(ticketTypeArray)) {
//           updatedData.ticketType = ticketTypeArray;
//         } else {
//           return res.status(400).json({ message: "Invalid ticketType format" });
//         }
//       } catch (error: any) {
//         return res.status(400).json({
//           message: "Failed to parse ticketType",
//           error: error.message,
//         });
//       }
//     }

//     if (socialMediaLinks) {
//       try {
//         updatedData.socialMediaLinks =
//           typeof socialMediaLinks === "string"
//             ? JSON.parse(socialMediaLinks)
//             : socialMediaLinks;
//       } catch (error) {
//         return res.status(400).json({
//           message:
//             "Invalid format for socialMediaLinks. Please send as a JSON object.",
//         });
//       }
//     }

//     if (req.files && Array.isArray(req.files)) {
//       const existingGallery = event.gallery || [];
//       const newGalleryUrls: string[] = [];

//       for (const file of req.files) {
//         const uploadResult = await cloudinary.uploader.upload(file.path);
//         newGalleryUrls.push(uploadResult.secure_url);
//       }

//       updatedData.gallery = [...existingGallery, ...newGalleryUrls];
//     }

//     if (req.file?.path) {
//       const uploadResult = await cloudinary.uploader.upload(req.file.path);
//       updatedData.image = uploadResult.secure_url;
//     }

//     if (Object.keys(updatedData).length === 0) {
//       return res.status(400).json({ message: "No valid fields to update" });
//     }

//     await EventInstance.update(updatedData, { where: { id } });

//     const updatedEvent = await EventInstance.findOne({ where: { id } });

//     return res.status(200).json({
//       message: "Event updated successfully",
//       event: updatedEvent,
//     });
//   } catch (error: any) {
//     console.error("Error updating event:", error.message);
//     return res.status(500).json({
//       message: "Error updating event",
//       error: error.message,
//     });
//   }
// };
// src/controllers/notificationCtrl.ts import { Response } from "express";
// import { NotificationInstance } from "../models/notificationModel";
// import { JwtPayload } from "jsonwebtoken";

// export const getUserNotifications = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const userId = req.user;

//     if (!userId) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized: Please log in to view notifications" });
//     }

//     const notifications = await NotificationInstance.findAll({
//       where: { userId },
//       order: [["createdAt", "DESC"]],
//     });

//     if (!notifications || notifications.length === 0) {
//       return res.status(404).json({ message: "No notifications found" });
//     }

//     return res
//       .status(200)
//       .json({ counts: notifications.length, notifications });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error fetching notifications", error: error.message });
//   }
// };

// export const markNotificationAsRead = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params;
//     const userId = req.user;

//     if (!userId) {
//       return res
//         .status(401)
//         .json({ message: "Unauthorized: Please log in to mark notifications" });
//     }

//     const notification = await NotificationInstance.findOne({
//       where: { id, userId },
//     });

//     if (!notification) {
//       return res.status(404).json({ message: "Notification not found" });
//     }

//     await NotificationInstance.update(
//       { isRead: true },
//       {
//         where: {
//           id,
//           userId,
//         },
//       }
//     );

//     return res.status(200).json({ message: "Notification marked as read" });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error updating notification", error: error.message });
//   }
// };

// export const deleteNotification = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { id } = req.params;
//     const userId = req.user;

//     if (!userId) {
//       return res.status(401).json({
//         message: "Unauthorized: Please log in to delete notifications",
//       });
//     }

//     const notification = await NotificationInstance.findOne({
//       where: { id, userId },
//     });

//     if (!notification) {
//       return res.status(404).json({ message: "Notification not found" });
//     }

//     await notification.destroy();
//     return res
//       .status(200)
//       .json({ message: "Notification deleted successfully" });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ message: "Error deleting notification", error: error.message });
//   }
// };
// src/controllers/paymentCtrl.ts import { Request, Response } from "express";
// import axios from "axios";
// import { TicketInstance } from "../models/ticketModel";
// import { v4 as uuidv4 } from "uuid";
// import {
//   ACCOUNT_OWNER_ID,
//   db,
//   FLUTTERWAVE_BASE_URL,
//   FLUTTERWAVE_HASH_SECRET,
//   FLUTTERWAVE_PUBLIC_KEY,
//   FLUTTERWAVE_SECRET_KEY,
//   FRONTEND_URL,
//   generateTicketSignature,
//   PAYSTACK_BASE_URL,
//   PAYSTACK_SECRET_KEY,
//   validatePaystackWebhook,
// } from "../config";
// import TransactionInstance from "../models/transactionModel";
// import EventInstance from "../models/eventModel";
// import { UserAttribute, UserInstance } from "../models/userModel";
// import QRCode from "qrcode";
// import { NotificationInstance } from "../models/notificationModel";
// import sendEmail from "../utilities/sendMail";
// import { v2 as cloudinary } from "cloudinary";
// import { CLOUDINARY_URL } from "../config";
// import { sendTicketEmail } from "../utilities/sendTicketEmail";

// cloudinary.config({
//   cloudinary_url: CLOUDINARY_URL,
// });

// const Flutterwave = require("flutterwave-node-v3");
// const flw = new Flutterwave(FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY);

// const generateReference = () => `unique-ref-${Date.now()}`;

// const getCustomFieldValue = (
//   customFields: any[],
//   variableName: string
// ): string => {
//   const field = customFields.find(
//     (field) => field.variable_name === variableName
//   );
//   return field ? field.value : "";
// };

// export const purchaseTicket = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   const { eventId } = req.params;
//   const { ticketType, currency, email, phone, fullName, attendees, quantity } =
//     req.body;

//   if (!email || !phone || !currency || !fullName || !quantity || quantity < 1) {
//     return res.status(400).json({
//       error: "Provide all required fields and a valid quantity",
//     });
//   }

//   if (!attendees && quantity !== 1) {
//     return res.status(400).json({
//       error: "Since no additional attendee, ticket quantity must be 1.",
//     });
//   }

//   if (
//     attendees &&
//     (!Array.isArray(attendees) || attendees.length !== quantity - 1)
//   ) {
//     return res.status(400).json({
//       error: "The number of attendees must match the ticket quantity.",
//     });
//   }

//   try {
//     const event = await EventInstance.findOne({ where: { id: eventId } });

//     if (!event) {
//       return res.status(404).json({ error: "Event not found" });
//     }

//     const eventDate = new Date(event.date);
//     const today = new Date();

//     today.setHours(0, 0, 0, 0);
//     eventDate.setHours(0, 0, 0, 0);

//     const eventDateString = eventDate.toISOString().split("T")[0];
//     const todayDateString = today.toISOString().split("T")[0];

//     if (eventDateString < todayDateString) {
//       return res.status(400).json({
//         error: "Cannot purchase tickets for expired events",
//       });
//     }

//     if (!Array.isArray(event.ticketType)) {
//       return res.status(400).json({ error: "Invalid ticket type structure" });
//     }

//     const ticketInfo = event.ticketType.find(
//       (ticket) => ticket.name === ticketType
//     );

//     if (!ticketInfo) {
//       return res.status(400).json({ error: "Invalid ticket type" });
//     }

//     if (Number(ticketInfo.quantity) < quantity) {
//       return res.status(400).json({
//         error: `Only ${ticketInfo.quantity} tickets are available for the selected type`,
//       });
//     }

//     const recipients = [{ name: fullName, email }, ...(attendees || [])];

//     const ticketPrice = parseFloat(ticketInfo.price);
//     const ticketId = uuidv4();
//     const signature = generateTicketSignature(ticketId);
//     const qrCodeData = `${FRONTEND_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;

//     const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);

//     const cloudinaryResult = await new Promise<string>((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         { folder: "qrcodes", resource_type: "image" },
//         (error, result) => {
//           if (error) {
//             console.error("Cloudinary upload error:", error);
//             return reject(error);
//           }
//           resolve(result?.url || "");
//         }
//       );

//       uploadStream.end(qrCodeBuffer);
//     });

//     if (ticketPrice === 0) {
//       const ticket = await TicketInstance.create({
//         id: ticketId,
//         email,
//         phone,
//         fullName,
//         eventId: event.id,
//         ticketType,
//         price: 0,
//         purchaseDate: new Date(),
//         qrCode: cloudinaryResult,
//         paid: true,
//         currency,
//         attendees: attendees || [{ name: fullName, email }],
//         validationStatus: "valid",
//         isScanned: false,
//       });

//       ticketInfo.quantity = (Number(ticketInfo.quantity) - quantity).toString();
//       ticketInfo.sold = (Number(ticketInfo.sold || 0) + quantity).toString();

//       await EventInstance.update(
//         { ticketType: event.ticketType },
//         { where: { id: event.id } }
//       );

//       await sendTicketEmail(fullName, email, event, ticket, 0, currency, 0);

//       return res.status(200).json({
//         message: "Ticket successfully created for free event",
//         ticketId: ticket.id,
//         redirect: FRONTEND_URL,
//         ticket,
//       });
//     }

//     // For paid tickets
//     const totalPrice = ticketPrice * quantity;

//     const ticket = await TicketInstance.create({
//       id: ticketId,
//       email,
//       phone,
//       fullName,
//       eventId: event.id,
//       ticketType,
//       price: totalPrice,
//       purchaseDate: new Date(),
//       qrCode: cloudinaryResult,
//       paid: false,
//       currency,
//       attendees: attendees || [{ name: fullName, email }],
//       validationStatus: "valid",
//       isScanned: false,
//     });

//     const eventOwner = (await UserInstance.findOne({
//       where: { id: event.userId },
//     })) as unknown as UserAttribute;

//     if (!eventOwner) {
//       return res.status(404).json({ error: "Event owner not found" });
//     }

//     const tx_ref = generateReference();

//     // Attempt to create a Flutterwave payment link
//     try {
//       const flutterwaveResponse = await axios.post(
//         `${FLUTTERWAVE_BASE_URL}/payments`,
//         {
//           customer: {
//             name: fullName,
//             email,
//           },
//           meta: {
//             ticketId,
//             quantity,
//             ticketPrice,
//           },
//           amount: totalPrice,
//           currency,
//           tx_ref,
//           redirect_url: `${FRONTEND_URL}/success?ticketId=${ticketId}`,
//           subaccounts: [
//             {
//               id: process.env.APP_OWNER_SUBACCOUNT_ID,
//               transaction_split_ratio: 10,
//             },
//             {
//               bank_account: {
//                 account_bank: eventOwner.account_bank,
//                 account_number: eventOwner.account_number,
//               },
//               country: eventOwner.country,
//               transaction_split_ratio: 90,
//             },
//           ],
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (
//         flutterwaveResponse.data &&
//         flutterwaveResponse.data.data &&
//         flutterwaveResponse.data.data.link
//       ) {
//         return res.status(200).json({
//           link: flutterwaveResponse.data.data.link,
//           ticketId,
//         });
//       } else {
//         throw new Error("Error creating Flutterwave payment link");
//       }
//     } catch (flutterwaveError: any) {
//       console.error("Flutterwave error:", flutterwaveError.message);

//       // Fallback to Paystack
//       try {
//         const paystackResponse = await axios.post(
//           `${PAYSTACK_BASE_URL}/transaction/initialize`,
//           {
//             email,
//             amount: totalPrice * 100, // Paystack expects amount in kobo/cents
//             callback_url: `${FRONTEND_URL}/success?ticketId=${ticketId}`,
//             metadata: {
//               custom_fields: [
//                 {
//                   display_name: "Ticket ID",
//                   variable_name: "ticket_id",
//                   value: ticketId,
//                 },
//                 {
//                   display_name: "Quantity",
//                   variable_name: "quantity",
//                   value: quantity.toString(),
//                 },
//                 {
//                   display_name: "Full Name",
//                   variable_name: "full_name",
//                   value: fullName,
//                 },
//                 {
//                   display_name: "Ticket Price",
//                   variable_name: "ticket_price",
//                   value: ticketPrice,
//                 },
//               ],
//             },
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (
//           paystackResponse.data &&
//           paystackResponse.data.data &&
//           paystackResponse.data.data.authorization_url
//         ) {
//           return res.status(200).json({
//             link: paystackResponse.data.data.authorization_url,
//             ticketId,
//           });
//         } else {
//           throw new Error("Error creating Paystack payment link");
//         }
//       } catch (paystackError: any) {
//         console.log(`Paystack error:`, paystackError.message);
//         return res.status(500).json({
//           error:
//             "Failed to create payment link with both Flutterwave and Paystack",
//         });
//       }
//     }

//     // if (!event) {
//     //   return res.status(404).json({ error: "Event not found" });
//     // }

//     // const eventDate = new Date(event.date);
//     // const today = new Date();

//     // today.setHours(0, 0, 0, 0);
//     // eventDate.setHours(0, 0, 0, 0);

//     // const eventDateString = eventDate.toISOString().split("T")[0];
//     // const todayDateString = today.toISOString().split("T")[0];

//     // if (eventDateString < todayDateString) {
//     //   return res.status(400).json({
//     //     error: "Cannot purchase tickets for expired events",
//     //   });
//     // }

//     // if (!Array.isArray(event.ticketType)) {
//     //   return res.status(400).json({ error: "Invalid ticket type structure" });
//     // }

//     // const ticketInfo = event.ticketType.find(
//     //   (ticket) => ticket.name === ticketType
//     // );

//     // if (!ticketInfo) {
//     //   return res.status(400).json({ error: "Invalid ticket type" });
//     // }

//     // if (Number(ticketInfo.quantity) < quantity) {
//     //   return res.status(400).json({
//     //     error: `Only ${ticketInfo.quantity} tickets are available for the selected type`,
//     //   });
//     // }

//     // const recipients = [{ name: fullName, email }, ...(attendees || [])];

//     // const ticketPrice = parseFloat(ticketInfo.price);
//     // const ticketId = uuidv4();
//     // const signature = generateTicketSignature(ticketId);
//     // const qrCodeData = `${FRONTEND_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;

//     // const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);

//     // const cloudinaryResult = await new Promise<string>((resolve, reject) => {
//     //   const uploadStream = cloudinary.uploader.upload_stream(
//     //     { folder: "qrcodes", resource_type: "image" },
//     //     (error, result) => {
//     //       if (error) {
//     //         console.error("Cloudinary upload error:", error);
//     //         return reject(error);
//     //       }
//     //       resolve(result?.url || "");
//     //     }
//     //   );

//     //   uploadStream.end(qrCodeBuffer);
//     // });

//     // if (ticketPrice === 0) {
//     //   const ticket = await TicketInstance.create({
//     //     id: ticketId,
//     //     email,
//     //     phone,
//     //     fullName,
//     //     eventId: event.id,
//     //     ticketType,
//     //     price: 0,
//     //     purchaseDate: new Date(),
//     //     qrCode: cloudinaryResult,
//     //     paid: true,
//     //     currency,
//     //     attendees: attendees || [{ name: fullName, email }],
//     //     validationStatus: "valid",
//     //     isScanned: false,
//     //   });

//     //   ticketInfo.quantity = (Number(ticketInfo.quantity) - quantity).toString();
//     //   ticketInfo.sold = (Number(ticketInfo.sold || 0) + quantity).toString();

//     //   await EventInstance.update(
//     //     { ticketType: event.ticketType },
//     //     { where: { id: event.id } }
//     //   );

//     //   // await sendTicketEmail(fullName, email, event, ticket, 0, currency);
//     //   const recipients = [{ name: fullName, email }, ...(attendees || [])];

//     //   for (const recipient of recipients) {
//     //     await sendTicketEmail(
//     //       recipient.name,
//     //       recipient.email,
//     //       event,
//     //       ticket,
//     //       0,
//     //       currency
//     //     );
//     //   }

//     //   return res.status(200).json({
//     //     message: "Ticket successfully created for free event",
//     //     ticketId: ticket.id,
//     //     redirect: FRONTEND_URL,
//     //     ticket,
//     //   });
//     // }

//     // // For paid tickets
//     // const totalPrice = ticketPrice * quantity;

//     // const ticket = await TicketInstance.create({
//     //   id: ticketId,
//     //   email,
//     //   phone,
//     //   fullName,
//     //   eventId: event.id,
//     //   ticketType,
//     //   price: totalPrice,
//     //   purchaseDate: new Date(),
//     //   qrCode: cloudinaryResult,
//     //   paid: false,
//     //   currency,
//     //   attendees: attendees || [{ name: fullName, email }],
//     //   validationStatus: "valid",
//     //   isScanned: false,
//     // });

//     // const eventOwner = (await UserInstance.findOne({
//     //   where: { id: event.userId },
//     // })) as unknown as UserAttribute;

//     // if (!eventOwner) {
//     //   return res.status(404).json({ error: "Event owner not found" });
//     // }

//     // const tx_ref = generateReference();

//     // // Attempt to create a Flutterwave payment link
//     // try {
//     //   const flutterwaveResponse = await axios.post(
//     //     `${FLUTTERWAVE_BASE_URL}/payments`,
//     //     {
//     //       customer: {
//     //         name: fullName,
//     //         email,
//     //       },
//     //       meta: {
//     //         ticketId,
//     //         quantity,
//     //       },
//     //       amount: totalPrice,
//     //       currency,
//     //       tx_ref,
//     //       redirect_url: `${FRONTEND_URL}/success?ticketId=${ticketId}`,
//     //       subaccounts: [
//     //         {
//     //           id: process.env.APP_OWNER_SUBACCOUNT_ID,
//     //           transaction_split_ratio: 10,
//     //         },
//     //         {
//     //           bank_account: {
//     //             account_bank: eventOwner.account_bank,
//     //             account_number: eventOwner.account_number,
//     //           },
//     //           country: eventOwner.country,
//     //           transaction_split_ratio: 90,
//     //         },
//     //       ],
//     //     },
//     //     {
//     //       headers: {
//     //         Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
//     //         "Content-Type": "application/json",
//     //       },
//     //     }
//     //   );

//     //   if (
//     //     flutterwaveResponse.data &&
//     //     flutterwaveResponse.data.data &&
//     //     flutterwaveResponse.data.data.link
//     //   ) {
//     //     return res.status(200).json({
//     //       link: flutterwaveResponse.data.data.link,
//     //       ticketId,
//     //     });
//     //   } else {
//     //     throw new Error("Error creating Flutterwave payment link");
//     //   }
//     // } catch (flutterwaveError: any) {
//     //   console.error("Flutterwave error:", flutterwaveError.message);

//     //   // Fallback to Paystack
//     //   try {
//     //     const paystackResponse = await axios.post(
//     //       `${PAYSTACK_BASE_URL}/transaction/initialize`,
//     //       {
//     //         email,
//     //         amount: totalPrice * 100, // Paystack expects amount in kobo/cents
//     //         callback_url: `${FRONTEND_URL}/success?ticketId=${ticketId}`,
//     //         metadata: {
//     //           custom_fields: [
//     //             {
//     //               display_name: "Ticket ID",
//     //               variable_name: "ticket_id",
//     //               value: ticketId,
//     //             },
//     //             {
//     //               display_name: "Quantity",
//     //               variable_name: "quantity",
//     //               value: quantity.toString(),
//     //             },
//     //             {
//     //               display_name: "Full Name",
//     //               variable_name: "full_name",
//     //               value: fullName,
//     //             },
//     //           ],
//     //         },
//     //       },
//     //       {
//     //         headers: {
//     //           Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//     //           "Content-Type": "application/json",
//     //         },
//     //       }
//     //     );

//     //     if (
//     //       paystackResponse.data &&
//     //       paystackResponse.data.data &&
//     //       paystackResponse.data.data.authorization_url
//     //     ) {
//     //       return res.status(200).json({
//     //         link: paystackResponse.data.data.authorization_url,
//     //         ticketId,
//     //       });
//     //     } else {
//     //       throw new Error("Error creating Paystack payment link");
//     //     }
//     //   } catch (paystackError: any) {
//     //     console.log(`Paystack error:`, paystackError.message);
//     //     return res.status(500).json({
//     //       error:
//     //         "Failed to create payment link with both Flutterwave and Paystack",
//     //     });
//     //   }
//     // }
//   } catch (error: any) {
//     return res.status(500).json({
//       error: "Failed to create ticket",
//       details: error.message,
//     });
//   }
// };

// export const handleUnifiedWebhook = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     // Validate Flutterwave webhook
//     const flutterwaveSignature =
//       req.headers["verif-hash"] || req.headers["Verif-Hash"];

//     // if (
//     //   flutterwaveSignature &&
//     //   flutterwaveSignature === FLUTTERWAVE_HASH_SECRET
//     // ) {
//     //   const payload = req.body;
//     //   if (payload.data.status === "successful") {
//     //     const { ticketId } = payload.meta_data;
//     //     const { email, name } = payload.data.customer;
//     //     const totalAmount = payload.data.amount;
//     //     const paymentReference = payload.data.flw_ref;
//     //     const currency = payload.data.currency;

//     //     await TransactionInstance.create({
//     //       id: payload.data.id,
//     //       email,
//     //       fullName: name,
//     //       ticketId,
//     //       paymentStatus: "successful",
//     //       totalAmount,
//     //       paymentReference,
//     //       currency,
//     //     });

//     //     return res
//     //       .status(200)
//     //       .json({ message: "Flutterwave webhook processed successfully" });
//     //   } else {
//     //     return res
//     //       .status(400)
//     //       .json({ error: "Flutterwave payment was not successful" });
//     //   }
//     // }

//     // // Validate Paystack webhook
//     // const paystackSignature = Array.isArray(req.headers["x-paystack-signature"])
//     //   ? req.headers["x-paystack-signature"][0]
//     //   : req.headers["x-paystack-signature"];

//     // if (!paystackSignature) {
//     //   return res.status(401).json({ error: "Missing Paystack signature" });
//     // }

//     // const payload = req.body;
//     // const payloadString = JSON.stringify(req.body);

//     // if (validatePaystackWebhook(paystackSignature, payloadString)) {
//     //   if (req.body.event === "charge.success") {
//     //     const { id, reference, amount, currency, metadata } = payload.data;
//     //     const { email } = payload.data.customer;
//     //     const totalAmount = amount / 100; // Convert back to base currency

//     //     const customFields = metadata?.custom_fields || [];
//     //     const ticketId = getCustomFieldValue(customFields, "ticket_id");
//     //     const fullName = getCustomFieldValue(customFields, "full_name");

//     //     await TransactionInstance.create({
//     //       id,
//     //       email,
//     //       fullName,
//     //       ticketId,
//     //       paymentStatus: "successful",
//     //       totalAmount,
//     //       paymentReference: reference,
//     //       currency,
//     //     });

//     //     return res
//     //       .status(200)
//     //       .json({ message: "Paystack webhook processed successfully" });
//     //   } else {
//     //     return res
//     //       .status(400)
//     //       .json({ error: "Invalid Paystack webhook event" });
//     //   }
//     // }

//     // return res.status(401).json({ error: "Invalid webhook signature" });

//     if (
//       flutterwaveSignature &&
//       flutterwaveSignature === FLUTTERWAVE_HASH_SECRET
//     ) {
//       const payload = req.body;
//       if (payload.data.status === "successful") {
//         const { ticketId } = payload.meta_data;
//         const { email, name } = payload.data.customer;
//         const totalAmount = payload.data.amount;
//         const paymentReference = payload.data.flw_ref;
//         const currency = payload.data.currency;

//         await TransactionInstance.create({
//           id: payload.data.id,
//           email,
//           fullName: name,
//           ticketId,
//           paymentStatus: "successful",
//           totalAmount,
//           paymentReference,
//           currency,
//         });

//         return res
//           .status(200)
//           .json({ message: "Flutterwave webhook processed successfully" });
//       } else {
//         return res
//           .status(400)
//           .json({ error: "Flutterwave payment was not successful" });
//       }
//     }

//     // Validate Paystack webhook
//     const paystackSignature = Array.isArray(req.headers["x-paystack-signature"])
//       ? req.headers["x-paystack-signature"][0]
//       : req.headers["x-paystack-signature"];

//     if (!paystackSignature) {
//       return res.status(401).json({ error: "Missing Paystack signature" });
//     }

//     const payload = req.body;
//     const payloadString = JSON.stringify(req.body);

//     if (validatePaystackWebhook(paystackSignature, payloadString)) {
//       if (req.body.event === "charge.success") {
//         const { id, reference, amount, currency, metadata } = payload.data;
//         const { email } = payload.data.customer;
//         const totalAmount = amount / 100; // Convert back to base currency

//         const customFields = metadata?.custom_fields || [];
//         const ticketId = getCustomFieldValue(customFields, "ticket_id");
//         const fullName = getCustomFieldValue(customFields, "full_name");

//         await TransactionInstance.create({
//           id,
//           email,
//           fullName,
//           ticketId,
//           paymentStatus: "successful",
//           totalAmount,
//           paymentReference: reference,
//           currency,
//         });

//         return res
//           .status(200)
//           .json({ message: "Paystack webhook processed successfully" });
//       } else {
//         return res
//           .status(400)
//           .json({ error: "Invalid Paystack webhook event" });
//       }
//     }

//     return res.status(401).json({ error: "Invalid webhook signature" });
//   } catch (error: any) {
//     console.error("Error processing webhook:", error.message);
//     return res.status(500).json({
//       error: "Internal server error",
//       details: error.message,
//     });
//   }
// };

// export const handlePaymentVerification = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   const { transactionId, reference } = req.body;

//   try {
//     let paymentDetails,
//       totalAmount,
//       ticketId,
//       ticketPrice,
//       quantity,
//       email,
//       name;

//     // if (transactionId) {
//     //   const flutterwaveResponse = await flw.Transaction.verify({
//     //     id: Number(transactionId),
//     //   });

//     //   paymentDetails = flutterwaveResponse.data;
//     //   if (paymentDetails.status !== "successful") {
//     //     return res.status(400).json({ error: "Payment verification failed" });
//     //   }

//     //   ({
//     //     amount: totalAmount,
//     //     meta: { ticketId, quantity },
//     //     customer: { email, name },
//     //   } = paymentDetails);
//     // } else if (reference) {
//     //   const {
//     //     data: { data },
//     //   } = await axios.get(
//     //     `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
//     //     { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
//     //   );

//     //   paymentDetails = data;
//     //   if (paymentDetails.status !== "success") {
//     //     return res.status(400).json({ error: "Payment verification failed" });
//     //   }

//     //   totalAmount = paymentDetails.amount / 100;
//     //   email = paymentDetails.customer.email;
//     //   ticketId = getCustomFieldValue(
//     //     paymentDetails.metadata?.custom_fields,
//     //     "ticket_id"
//     //   );
//     //   name = getCustomFieldValue(
//     //     paymentDetails.metadata?.custom_fields,
//     //     "full_name"
//     //   );
//     //   quantity = parseInt(
//     //     getCustomFieldValue(
//     //       paymentDetails.metadata?.custom_fields,
//     //       "quantity"
//     //     ) || "1",
//     //     10
//     //   );
//     // } else {
//     //   return res.status(400).json({ error: "Missing transaction identifier" });
//     // }

//     // const paymentReference = paymentDetails.reference || paymentDetails.flw_ref;
//     // const currency = paymentDetails.currency;
//     // const id = paymentDetails.id;

//     // const [existingTransaction, existingTicket] = await Promise.all([
//     //   TransactionInstance.findOne({
//     //     where: { paymentReference, paymentStatus: "successful" },
//     //   }),
//     //   TicketInstance.findOne({
//     //     where: { id: ticketId, paid: true, validationStatus: "valid" },
//     //   }),
//     // ]);

//     // if (existingTransaction && existingTicket) {
//     //   return res.status(400).json({ error: "Payment already processed." });
//     // }

//     // const transaction = await db.transaction();
//     // try {
//     //   if (!existingTransaction) {
//     //     await TransactionInstance.create(
//     //       {
//     //         id,
//     //         email,
//     //         fullName: name,
//     //         ticketId,
//     //         paymentStatus: "successful",
//     //         totalAmount,
//     //         paymentReference,
//     //         currency,
//     //       },
//     //       { transaction }
//     //     );
//     //   }

//     //   const ticket = await TicketInstance.findOne({
//     //     where: { id: ticketId },
//     //     transaction,
//     //   });
//     //   if (!ticket) throw new Error("Ticket not found");

//     //   const event = await EventInstance.findOne({
//     //     where: { id: ticket.eventId },
//     //     transaction,
//     //   });
//     //   if (!event) throw new Error("Event not found");

//     //   ticket.validationStatus = "valid";
//     //   ticket.paid = true;
//     //   ticket.flwRef = paymentReference;
//     //   await ticket.save({ transaction });

//     //   const ticketType = event.ticketType.find(
//     //     (t) => t.name === ticket.ticketType
//     //   );
//     //   if (!ticketType || ticketType.quantity < quantity) {
//     //     throw new Error("Not enough tickets available");
//     //   }
//     //   ticketType.sold = (
//     //     parseInt(ticketType.sold || "0") + quantity
//     //   ).toString();
//     //   ticketType.quantity = (
//     //     parseInt(ticketType.quantity || "0") - quantity
//     //   ).toString();

//     //   await EventInstance.update(
//     //     { ticketType: event.ticketType },
//     //     { where: { id: event.id }, transaction }
//     //   );

//     //   const eventOwner = await UserInstance.findOne({
//     //     where: { id: event.userId },
//     //     transaction,
//     //   });
//     //   if (eventOwner) {
//     //     await NotificationInstance.create(
//     //       {
//     //         id: uuidv4(),
//     //         title: `Ticket purchased for "${event.title}"`,
//     //         message: `A ticket was purchased for "${
//     //           event.title
//     //         }". Amount: ${currency} ${(totalAmount * 0.8847).toFixed(
//     //           2
//     //         )}. Purchaser: ${ticket.fullName}.`,
//     //         userId: event.userId,
//     //         isRead: false,
//     //       },
//     //       { transaction }
//     //     );
//     //   }

//     //   const appOwnerEarnings = parseFloat((totalAmount * 0.0983).toFixed(2));

//     //   await UserInstance.increment(
//     //     { totalEarnings: appOwnerEarnings },
//     //     { where: { id: ACCOUNT_OWNER_ID }, transaction }
//     //   );

//     //   await sendTicketEmail(name, email, event, ticket, totalAmount, currency);

//     //   await transaction.commit();
//     //   res.status(200).json({ message: "Payment verified and processed" });
//     // } catch (err) {
//     //   await transaction.rollback();
//     //   throw err;
//     // }

//     if (transactionId) {
//       const flutterwaveResponse = await flw.Transaction.verify({
//         id: Number(transactionId),
//       });

//       paymentDetails = flutterwaveResponse.data;
//       if (paymentDetails.status !== "successful") {
//         return res.status(400).json({ error: "Payment verification failed" });
//       }

//       ({
//         amount: totalAmount,
//         meta: { ticketId, quantity, ticketPrice },
//         customer: { email, name },
//       } = paymentDetails);
//     } else if (reference) {
//       const {
//         data: { data },
//       } = await axios.get(
//         `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
//         { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
//       );

//       paymentDetails = data;
//       if (paymentDetails.status !== "success") {
//         return res.status(400).json({ error: "Payment verification failed" });
//       }

//       totalAmount = paymentDetails.amount / 100;
//       email = paymentDetails.customer.email;
//       ticketId = getCustomFieldValue(
//         paymentDetails.metadata?.custom_fields,
//         "ticket_id"
//       );
//       name = getCustomFieldValue(
//         paymentDetails.metadata?.custom_fields,
//         "full_name"
//       );
//       quantity = parseInt(
//         getCustomFieldValue(
//           paymentDetails.metadata?.custom_fields,
//           "quantity"
//         ) || "1",
//         10
//       );
//       ticketPrice = parseInt(
//         getCustomFieldValue(
//           paymentDetails.metadata?.custom_fields,
//           "ticket_price"
//         ) || "1",
//         10
//       );
//     } else {
//       return res.status(400).json({ error: "Missing transaction identifier" });
//     }

//     const paymentReference = paymentDetails.reference || paymentDetails.flw_ref;
//     const currency = paymentDetails.currency;
//     const id = paymentDetails.id;

//     const [existingTransaction, existingTicket] = await Promise.all([
//       TransactionInstance.findOne({
//         where: { paymentReference, paymentStatus: "successful" },
//       }),
//       TicketInstance.findOne({
//         where: { id: ticketId, paid: true, validationStatus: "valid" },
//       }),
//     ]);

//     if (existingTransaction && existingTicket) {
//       return res.status(400).json({ error: "Payment already processed." });
//     }

//     const transaction = await db.transaction();
//     try {
//       if (!existingTransaction) {
//         await TransactionInstance.create(
//           {
//             id,
//             email,
//             fullName: name,
//             ticketId,
//             paymentStatus: "successful",
//             totalAmount,
//             paymentReference,
//             currency,
//           },
//           { transaction }
//         );
//       }

//       const ticket = await TicketInstance.findOne({
//         where: { id: ticketId },
//         transaction,
//       });
//       if (!ticket) throw new Error("Ticket not found");

//       const event = await EventInstance.findOne({
//         where: { id: ticket.eventId },
//         transaction,
//       });
//       if (!event) throw new Error("Event not found");

//       ticket.validationStatus = "valid";
//       ticket.paid = true;
//       ticket.flwRef = paymentReference;
//       await ticket.save({ transaction });

//       const ticketType = event.ticketType.find(
//         (t) => t.name === ticket.ticketType
//       );
//       if (!ticketType || ticketType.quantity < quantity) {
//         throw new Error("Not enough tickets available");
//       }
//       ticketType.sold = (
//         parseInt(ticketType.sold || "0") + quantity
//       ).toString();
//       ticketType.quantity = (
//         parseInt(ticketType.quantity || "0") - quantity
//       ).toString();

//       await EventInstance.update(
//         { ticketType: event.ticketType },
//         { where: { id: event.id }, transaction }
//       );

//       const eventOwner = await UserInstance.findOne({
//         where: { id: event.userId },
//         transaction,
//       });
//       if (eventOwner) {
//         await NotificationInstance.create(
//           {
//             id: uuidv4(),
//             title: `Ticket purchased for "${event.title}"`,
//             message: `A ticket was purchased for "${
//               event.title
//             }". Amount: ${currency} ${(totalAmount * 0.8847).toFixed(
//               2
//             )}. Purchaser: ${ticket.fullName}.`,
//             userId: event.userId,
//             isRead: false,
//           },
//           { transaction }
//         );
//       }

//       const appOwnerEarnings = parseFloat((totalAmount * 0.0983).toFixed(2));

//       await UserInstance.increment(
//         { totalEarnings: appOwnerEarnings },
//         { where: { id: ACCOUNT_OWNER_ID }, transaction }
//       );

//       await sendTicketEmail(
//         name,
//         email,
//         event,
//         ticket,
//         totalAmount,
//         currency,
//         ticketPrice
//       );

//       await transaction.commit();
//       res.status(200).json({ message: "Payment verified and processed" });
//     } catch (err) {
//       await transaction.rollback();
//       throw err;
//     }
//   } catch (err: any) {
//     console.error("Payment verification error:", err.message);
//     res
//       .status(500)
//       .json({ error: "Internal server error", details: err.message });
//   }
// };

// export const handlePaymentVerification1 = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   const { transactionId, reference } = req.body;

//   try {
//     let paymentDetails;
//     let totalAmount;
//     let ticketId;
//     let quantity;
//     let email;
//     let name;

//     if (transactionId) {
//       const transactionIdAsNumber = Number(transactionId);
//       if (isNaN(transactionIdAsNumber)) {
//         return res.status(400).json({ error: "Invalid transaction ID format" });
//       }

//       const flutterwaveResponse = await flw.Transaction.verify({
//         id: transactionIdAsNumber,
//       });

//       paymentDetails = flutterwaveResponse.data;

//       if (paymentDetails.status !== "successful") {
//         return res.status(400).json({ error: "Payment verification failed" });
//       }

//       totalAmount = paymentDetails.amount;
//       ticketId = paymentDetails.meta.ticketId;
//       quantity = paymentDetails.meta.quantity;
//       email = paymentDetails.customer.email;
//       name = paymentDetails.customer.name;
//     } else if (reference) {
//       // Check if the transaction is from Paystack
//       const paystackResponse = await axios.get(
//         `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
//         {
//           headers: {
//             Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
//           },
//         }
//       );

//       paymentDetails = paystackResponse.data.data;
//       if (paymentDetails.status !== "success") {
//         return res.status(400).json({ error: "Payment verification failed" });
//       }
//       totalAmount = paymentDetails.amount / 100;
//       email = paymentDetails.customer.email;

//       const customFields = paymentDetails.metadata?.custom_fields || [];
//       ticketId = getCustomFieldValue(customFields, "ticket_id");
//       name = getCustomFieldValue(customFields, "full_name");
//       quantity = parseInt(
//         getCustomFieldValue(customFields, "quantity") || "1",
//         10
//       );
//     } else {
//       return res.status(400).json({ error: "Missing transaction identifier" });
//     }

//     const paymentReference = paymentDetails.reference || paymentDetails.flw_ref;
//     const currency = paymentDetails.currency;
//     const id = paymentDetails.id;

//     const existingTransaction = await TransactionInstance.findOne({
//       where: { paymentReference, paymentStatus: "successful" },
//     });

//     const existingTicket = await TicketInstance.findOne({
//       where: { id: ticketId, paid: true, validationStatus: "valid" },
//     });

//     if (existingTransaction && existingTicket) {
//       return res.status(400).json({
//         error: "Payment already verified and cannot be processed again.",
//       });
//     }

//     const transaction = await db.transaction();
//     try {
//       if (!existingTransaction) {
//         await TransactionInstance.create(
//           {
//             id,
//             email,
//             fullName: name,
//             ticketId,
//             paymentStatus: "successful",
//             totalAmount,
//             paymentReference,
//             currency,
//           },
//           { transaction }
//         );
//       }

//       const ticket = await TicketInstance.findOne({
//         where: { id: ticketId },
//         transaction,
//       });

//       if (!ticket) throw new Error("Ticket not found");

//       const event = await EventInstance.findOne({
//         where: { id: ticket.eventId },
//         transaction,
//       });

//       if (!event) throw new Error("Event not found");

//       ticket.validationStatus = "valid";
//       ticket.paid = true;
//       ticket.flwRef = paymentReference;
//       await ticket.save({ transaction });

//       const ticketTypeIndex = event.ticketType.findIndex(
//         (type) => type.name === ticket.ticketType
//       );

//       if (ticketTypeIndex >= 0) {
//         const ticketType = event.ticketType[ticketTypeIndex];
//         const currentSold = parseInt(ticketType.sold || "0", 10);
//         const currentQuantity = parseInt(ticketType.quantity || "0", 10);

//         if (currentQuantity < quantity) {
//           throw new Error("Not enough tickets available");
//         }

//         event.ticketType[ticketTypeIndex] = {
//           ...ticketType,
//           sold: (currentSold + parseInt(quantity, 10)).toString(),
//           quantity: (currentQuantity - parseInt(quantity, 10)).toString(),
//         };

//         await EventInstance.update(
//           { ticketType: event.ticketType },
//           { where: { id: event.id }, transaction }
//         );
//       } else {
//         throw new Error("Ticket type not found in the event");
//       }

//       const eventOwner = await UserInstance.findOne({
//         where: { id: event.userId },
//         transaction,
//       });

//       if (eventOwner) {
//         const earnings = (totalAmount * 0.8847).toFixed(2);
//         await NotificationInstance.create(
//           {
//             id: uuidv4(),
//             title: `Ticket purchased for your event "${event.title}"`,
//             message: `A ticket for your event titled "${event.title}" has been purchased. Amount paid: ${currency} ${earnings}. Purchaser: ${ticket.fullName}.`,
//             userId: event.userId,
//             isRead: false,
//           },
//           { transaction }
//         );
//       }

//       const appOwnerEarnings = parseFloat((totalAmount * 0.0983).toFixed(2));

//       await UserInstance.increment(
//         { totalEarnings: appOwnerEarnings },
//         { where: { id: ACCOUNT_OWNER_ID }, transaction }
//       );

//       // start
//       // // Compute event start and end times for calendar links
//       // const eventDate = new Date(event.date);
//       // const startDateTime = new Date(eventDate);
//       // startDateTime.setHours(10, 0, 0); // Default start time: 10:00 AM
//       // const endDateTime = new Date(startDateTime);
//       // endDateTime.setHours(11, 0, 0); // 1-hour duration

//       // // Helper function to format dates for Google Calendar
//       // function formatDateForGoogle(date:any) {
//       //   const year = date.getUTCFullYear();
//       //   const month = ("0" + (date.getUTCMonth() + 1)).slice(-2);
//       //   const day = ("0" + date.getUTCDate()).slice(-2);
//       //   const hour = ("0" + date.getUTCHours()).slice(-2);
//       //   const minute = ("0" + date.getUTCMinutes()).slice(-2);
//       //   const second = ("0" + date.getUTCSeconds()).slice(-2);
//       //   return `${year}${month}${day}T${hour}${minute}${second}Z`;
//       // }

//       // const startFormatted = formatDateForGoogle(startDateTime);
//       // const endFormatted = formatDateForGoogle(endDateTime);

//       // // Format for Outlook's ISO string
//       // const startISOString = startDateTime.toISOString();
//       // const endISOString = endDateTime.toISOString();

//       function generateGoogleCalendarLink(event: any): string {
//         const formatDateForGoogleCalendar = (date: Date) => {
//           return date
//             .toISOString()
//             .replace(/[-:]/g, "")
//             .replace(/\.\d{3}Z$/, "Z");
//         };

//         const startDate = formatDateForGoogleCalendar(new Date(event.date));
//         const endDate = formatDateForGoogleCalendar(new Date(event.date)); // same if it's a one-day event

//         return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
//           event.title
//         )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
//           event.description || ""
//         )}&location=${encodeURIComponent(
//           event.location || ""
//         )}&sf=true&output=xml`;
//       }

//       // ends

//       const mailSubject = `Your Ticket for "${event.title}"`;

//       const calendarLink = generateGoogleCalendarLink(event);

//       const mailMessage = `
//               <p>Dear ${name},</p>

//               <p>Thank you for purchasing a ticket for the event "<strong>${
//                 event.title
//               }</strong>".</p>

//               <p>Here are your ticket details:</p>

//               <ul>
//                 <li><strong>Event:</strong> ${event.title}</li>
//                 <li><strong>Ticket Type:</strong> ${ticket.ticketType}</li>
//                 <li><strong>Price:</strong> ${currency} ${totalAmount.toFixed(
//         2
//       )}</li>
//                 <li><strong>Quantity:</strong> ${quantity}</li>
//                 <li><strong>Date:</strong> ${new Date(
//                   event.date
//                 ).toLocaleString()}</li>
//               </ul>

//               <p><strong>Add this event to your calendar:</strong><br>
//               <a href="${calendarLink}" target="_blank" style="background-color:#4CAF50;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">Add to Google Calendar</a></p>

//               <p>Please find your ticket QR code below. You can also download it using the link provided:</p>

//               <img src="${
//                 ticket.qrCode
//               }" alt="Ticket QR Code" style="max-width: 200px;">

//               <p><a href="${
//                 ticket.qrCode
//               }" download="ticket_qrcode.png">Download QR Code</a></p>

//               <p>Best regards,<br>V Ticket Team</p>
// `;
//       try {
//         await sendEmail({
//           email,
//           subject: mailSubject,
//           message: mailMessage,
//         });
//       } catch (error: any) {
//         await transaction.rollback();
//         console.error("Email sending failed:", error.message);
//         return res.status(500).json({ error: "Failed to send email" });
//       }

//       await transaction.commit();

//       return res
//         .status(200)
//         .json({ message: "Payment verified and processed" });
//     } catch (error: any) {
//       await transaction.rollback();
//       throw error;
//     }
//   } catch (error: any) {
//     console.error("Error during payment verification:", error.message);
//     return res.status(500).json({
//       error: "Internal server error",
//       details: error.message,
//     });
//   }
// };
// src/controllers/ticketCtrl.ts import { Request, Response } from "express";
// import { EventInstance } from "../models/eventModel";
// import { TicketInstance } from "../models/ticketModel";
// import { JwtPayload } from "jsonwebtoken";
// import { ModeratorInstance } from "../models/moderatorModel";
// import { UserAttribute, UserInstance } from "../models/userModel";
// import sharp from "sharp";
// import { verifyTicketSignature } from "../config";

// // @ts-ignore
// const QRCodeReader = require("qrcode-reader");

// export const getEventTickets = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   const { eventId } = req.params;
//   const userId = req.user;

//   try {
//     const event = await EventInstance.findOne({
//       where: { id: eventId, userId },
//     });
//     if (!event)
//       return res
//         .status(404)
//         .json({ error: "Event not found or you are not the event owner" });

//     const tickets = await TicketInstance.findAll({ where: { eventId } });

//     return res.status(200).json({ counts: tickets.length, tickets });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ error: "Failed to fetch tickets", details: error.message });
//   }
// };

// export const cancelTicket = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   const { ticketId } = req.params;

//   try {
//     const ticket = await TicketInstance.findOne({ where: { id: ticketId } });
//     if (!ticket) return res.status(404).json({ error: "Ticket not found" });

//     await ticket.destroy();
//     return res.status(200).json({ message: "Ticket canceled successfully" });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ error: "Failed to cancel ticket", details: error.message });
//   }
// };

// export const validateTicket = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   const { ticketId, signature } = req.query;

//   if (!ticketId || !signature) {
//     return res
//       .status(400)
//       .json({ message: "Ticket ID and signature are required" });
//   }

//   if (!verifyTicketSignature(ticketId as string, signature as string)) {
//     return res.status(403).json({ message: "Invalid QR code signature" });
//   }

//   try {
//     const ticket = await TicketInstance.findOne({ where: { id: ticketId } });

//     if (!ticket) {
//       return res.status(404).json({ message: "Ticket not found" });
//     }

//     if (ticket.isScanned === true) {
//       return res.status(200).json({
//         message: "Ticket already scanned",
//         ticket,
//       });
//     }

//     ticket.isScanned = true;
//     await ticket.save();

//     return res.status(200).json({
//       message: "Ticket successfully scanned",
//       ticket,
//     });
//   } catch (error: any) {
//     console.error("Error validating ticket:", error);
//     return res.status(500).json({
//       message: "An error occurred while validating the ticket",
//       error: error.message,
//     });
//   }
// };

// export const deleteAllTickets = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const deletedCount = await TicketInstance.destroy({
//       where: {},
//     });

//     if (deletedCount === 0) {
//       return res.status(404).json({
//         message: "No tickets found to delete",
//       });
//     }

//     return res.status(200).json({
//       message: "All tickets have been successfully deleted",
//       deletedCount,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       error: "An error occurred while deleting tickets",
//       details: error.message,
//     });
//   }
// };

// export const getTicketById = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   const { ticketId } = req.params;

//   try {
//     const ticket = await TicketInstance.findOne({ where: { id: ticketId } });

//     if (!ticket) {
//       return res.status(404).json({ error: "Ticket not found" });
//     }

//     return res.status(200).json({ ticket });
//   } catch (error: any) {
//     return res
//       .status(500)
//       .json({ error: "Failed to fetch tickets", details: error.message });
//   }
// };
// src/controllers/userCtrl.ts import { Request, Response } from "express";
// import { UserAttribute, UserInstance } from "../models/userModel";
// import { v4 as uuidv4 } from "uuid";
// import { userRegistrationSchema } from "../utilities/validation";
// import bcrypt from "bcryptjs";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import speakeasy from "speakeasy";
// import dayjs, { ManipulateType } from "dayjs";
// import { Sequelize } from "sequelize";

// import {
//   db,
//   EXPIRESIN,
//   generateRandomAlphaNumeric,
//   JWT_SECRET,
//   REFRESH_EXPIRESIN,
//   resetPasswordExpireMinutes,
//   resetPasswordExpireUnit,
//   SALT_ROUNDS,
// } from "../config";
// import sendEmail from "../utilities/sendMail";

// export const register = async (req: Request, res: Response): Promise<any> => {
//   const transaction = await db.transaction();
//   try {
//     const {
//       fullName,
//       phone,
//       email,
//       password,
//       businessName,
//       companyWebsite,
//       address,
//       timezone,
//     } = req.body;

//     const validateResult = userRegistrationSchema.validate(req.body);

//     if (validateResult.error) {
//       return res.status(400).json({
//         Error: validateResult.error.details[0].message,
//       });
//     }

//     const newEmail = email.trim().toLowerCase();
//     const existingUser = await UserInstance.findOne({
//       where: { email: newEmail },
//       transaction,
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         Error: "Email already exists",
//       });
//     }

//     const salt = await bcrypt.genSalt(SALT_ROUNDS);
//     const userPassword = await bcrypt.hash(password, salt);

//     const userValidationSecret = speakeasy.generateSecret().base32;
//     const otpVerificationExpiry = dayjs()
//       .add(
//         resetPasswordExpireMinutes,
//         resetPasswordExpireUnit as ManipulateType
//       )
//       .toDate();

//     const user = await UserInstance.create(
//       {
//         id: uuidv4(),
//         fullName,
//         phone,
//         email: newEmail,
//         password: userPassword,
//         role: "user",
//         profilePic:
//           "https://images.squarespace-cdn.com/content/v1/54642373e4b024e8934bf4f4/8c711e5f-367a-43a8-8d43-ef18a3a04508/the+citadel.jpg",
//         businessName,
//         companyWebsite,
//         address,
//         timezone,
//         country: "",
//         userValidationSecret,
//         otpVerificationExpiry,
//         isVerified: true,
//         totalEarnings: 0,
//       },
//       { transaction }
//     );

//     const {
//       password: _,
//       userValidationSecret: __,
//       ...userWithoutSensitiveData
//     } = user.get({ plain: true });

//     const resetUrl = `${req.protocol}://${req.get(
//       "host"
//     )}/auth/verify-otp/${userValidationSecret}`;

//     const message = `You are receiving this email because you (or someone else) has requested for an OTP. Please make a POST request to: \n\n ${resetUrl}. This OTP will expire in the next 10 mins`;

//     await sendEmail({
//       email: newEmail,
//       subject: "Register Successfully",
//       message: `You are receiving this email because you (or someone else) has registered with this ${newEmail} address.`,
//     });

//     await transaction.commit();

//     return res.status(201).json({
//       message: "User created successfully.",
//       // "User created successfully. Please check your email to verify your account.",
//       user: userWithoutSensitiveData,
//     });
//   } catch (error: any) {
//     await transaction.rollback();
//     res.status(500).json({
//       Error: `Internal server error: ${error.message}`,
//       route: "users/register",
//     });
//   }
// };

// export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { email, secret } = req.body;

//     const newEmail = email.trim().toLowerCase();

//     const user = (await UserInstance.findOne({
//       where: { email: newEmail },
//     })) as unknown as UserAttribute;

//     if (!user) {
//       return res.status(404).json({ Error: "User not found" });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({ message: "Account already verified" });
//     }

//     if (dayjs().isAfter(dayjs(user.otpVerificationExpiry))) {
//       return res.status(400).json({
//         message: "Verification code expired. Please request a new one.",
//       });
//     }

//     if (secret !== user.userValidationSecret) {
//       return res.status(400).json({ message: "Invalid verification code" });
//     }

//     await UserInstance.update(
//       {
//         isVerified: true,
//         userValidationSecret: null,
//         otpVerificationExpiry: null,
//       },
//       { where: { email: user.email } }
//     );

//     return res.status(200).json({ message: "Account verified successfully" });
//   } catch (error: any) {
//     res.status(500).json({
//       Error: `Internal server error: ${error.message}`,
//       route: "users/verify",
//     });
//   }
// };

// export const resendVerificationOTP = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { email } = req.body;

//     const newEmail = email.trim().toLowerCase();

//     const user = (await UserInstance.findOne({
//       where: { email: newEmail },
//     })) as unknown as UserAttribute;

//     if (!user) {
//       return res.status(404).json({ Error: "User not found" });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({ message: "Account already verified" });
//     }

//     const userValidationSecret = speakeasy.generateSecret().base32;
//     const otpVerificationExpiry = dayjs()
//       .add(
//         resetPasswordExpireMinutes,
//         resetPasswordExpireUnit as ManipulateType
//       )
//       .toDate();

//     user.userValidationSecret = userValidationSecret;
//     user.otpVerificationExpiry;

//     await UserInstance.update(
//       {
//         userValidationSecret,
//         otpVerificationExpiry,
//       },
//       { where: { email: user.email } }
//     );

//     const resetUrl = `${req.protocol}://${req.get(
//       "host"
//     )}/auth/verify-otp/${userValidationSecret}`;

//     const message = `You are receiving this email because you (or someone else) has requested for an OTP. Please make a POST request to: \n\n ${resetUrl}. This OTP will expire in the next 10 mins`;

//     // await sendEmail({
//     //   email: newEmail,
//     //   subject: "Verify Your Account",
//     //   message,
//     // });

//     return res.status(200).json({
//       message:
//         "Verification code resent successfully. Please check your email.",
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       Error: `Internal server error: ${error.message}`,
//       route: "users/resend-verification",
//     });
//   }
// };

// export const login = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         Error: "Invalid credentials",
//       });
//     }

//     const newEmail = email.trim().toLowerCase();

//     const user = (await UserInstance.findOne({
//       where: { email: newEmail },
//     })) as unknown as UserAttribute;
//     if (!user) {
//       return res.status(400).json({
//         Error: "Invalid credentials",
//       });
//     }

//     if (user.isVerified === false) {
//       return res.status(400).json({
//         Error:
//           "Your account has not been verified please request for an otp by clicking the button below",
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(400).json({
//         Error: "Invalid credentials",
//       });
//     }

//     const token = jwt.sign(
//       { id: user.id, email: user.email!, role: user.role },
//       JWT_SECRET!,
//       { expiresIn: "1h" }
//     );

//     const refreshToken = jwt.sign(
//       { id: user.id, email: user.email!, role: user.role },
//       JWT_SECRET!,
//       { expiresIn: "7h" }
//     );

//     user.password = undefined!;
//     return res.status(200).json({
//       message: "Login successful",
//       token,
//       refreshToken,
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({
//       Error: "Internal server error",
//       route: "users/login",
//     });
//   }
// };

// export const changePassword = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { email, previousPassword, newPassword } = req.body;

//     if (!email || !previousPassword || !newPassword) {
//       return res.status(400).json({
//         Error: "Fill all the fields",
//       });
//     }

//     if (newPassword && (newPassword.length < 5 || newPassword.length > 30)) {
//       return res.json({
//         error: "Password should be between 5 and 30 characters",
//       });
//     }

//     const newEmail = email.trim().toLowerCase();
//     const user = (await UserInstance.findOne({
//       where: { email: newEmail },
//     })) as unknown as UserAttribute;
//     if (!user) {
//       return res.status(400).json({
//         Error: "Invalid credentials",
//       });
//     }

//     const isPasswordValid = await bcrypt.compare(
//       previousPassword,
//       user.password
//     );
//     if (!isPasswordValid) {
//       return res.status(400).json({
//         Error: "Please check your previous password",
//       });
//     }

//     const salt = await bcrypt.genSalt(SALT_ROUNDS);
//     const userPassword = (await bcrypt.hash(newPassword, salt)) as string;

//     await UserInstance.update(
//       { password: userPassword },
//       { where: { email: newEmail } }
//     );

//     return res.status(200).json({
//       message: "Password successfully updated",
//     });
//   } catch (error) {
//     res.status(500).json({
//       Error: "Internal server error",
//       route: "users/change-password",
//     });
//   }
// };

// export const passwordRecovery = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const { email } = req.body;

//     const newEmail = email.trim().toLowerCase();
//     const user = (await UserInstance.findOne({
//       where: { email: newEmail },
//     })) as unknown as UserAttribute;

//     if (!user) {
//       return res.status(400).json({
//         Error: "Invalid credentials",
//       });
//     }

//     const resetPassword = generateRandomAlphaNumeric(7);

//     const salt = await bcrypt.genSalt(SALT_ROUNDS);
//     const userPassword = (await bcrypt.hash(resetPassword, salt)) as string;

//     const updatedPassword = await UserInstance.update(
//       { password: userPassword },
//       { where: { email: newEmail } }
//     );

//     if (updatedPassword) {
//       const resetUrl = `${req.protocol}://${req.get(
//         "host"
//       )}/auth/resetpassword/${userPassword}`;

//       const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PATCH request to: \n\n ${resetUrl}`;

//       try {
//         // await sendEmail({
//         //   email: user.email,
//         //   subject: "Password reset token",
//         //   message,
//         // });

//         return res
//           .status(200)
//           .json({ success: true, data: "Email sent", password: resetPassword });
//       } catch (err: any) {
//         return res
//           .status(500)
//           .json({ success: false, data: `Email not sent: ${err.message}` });
//       }
//     }
//   } catch (error: any) {
//     res.status(500).json({
//       Error: `Internal server error ${error.message}`,
//       route: "users/password-recovery",
//     });
//   }
// };

// export const getProfile = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const userId = req.user;

//     const user = await UserInstance.findOne({
//       where: { id: userId },
//       attributes: {
//         exclude: [
//           "password",
//           "userValidationSecret",
//           "otpVerificationExpiry",
//           "updatedAt",
//           "createdAt",
//           "id",
//         ],
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ Error: "User not found" });
//     }

//     return res.status(200).json({
//       message: "User profile fetched successfully",
//       user,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       Error: `Internal server error: ${error.message}`,
//       route: "users/get-profile",
//     });
//   }
// };

// export const updateProfile = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const userId = req.user;
//     const {
//       fullName,
//       phone,
//       profilePic,
//       businessName,
//       companyWebsite,
//       address,
//       country,
//       timezone,
//       account_bank,
//       account_number,
//     } = req.body;

//     const user = await UserInstance.findOne({
//       where: { id: userId },
//       attributes: {
//         exclude: [
//           "password",
//           "userValidationSecret",
//           "otpVerificationExpiry",
//           "updatedAt",
//           "createdAt",
//           "id",
//         ],
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ Error: "User not found" });
//     }

//     const updateFields: any = {};

//     if (fullName) updateFields.fullName = fullName;
//     if (phone) updateFields.phone = phone;
//     if (profilePic) updateFields.profilePic = profilePic;
//     if (businessName) updateFields.businessName = businessName;
//     if (companyWebsite) updateFields.companyWebsite = companyWebsite;
//     if (address) updateFields.address = address;
//     if (timezone) updateFields.timezone = timezone;
//     if (country) updateFields.country = country;
//     if (account_bank) updateFields.account_bank = account_bank;
//     if (account_number) updateFields.account_number = account_number;

//     if (Object.keys(updateFields).length === 0) {
//       return res.status(400).json({ Error: "No valid fields to update" });
//     }

//     await UserInstance.update(updateFields, { where: { id: userId } });

//     return res.status(200).json({
//       message: "Profile updated successfully",
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       Error: `Internal server error: ${error.message}`,
//       route: "users/update-profile",
//     });
//   }
// };

// export const uploadPicture = async (
//   req: JwtPayload,
//   res: Response
// ): Promise<any> => {
//   try {
//     const userId = req.user;
//     const fileUrl = req.file?.path;

//     const user = await UserInstance.findOne({ where: { id: userId } });

//     if (!user) {
//       return res.status(400).json({ message: "Please login" });
//     }

//     if (!fileUrl) {
//       return res.status(400).json({ message: "File upload failed" });
//     }

//     await UserInstance.update(
//       { profilePic: fileUrl },
//       { where: { id: userId } }
//     );

//     return res.status(200).json({
//       message: "Profile updated successfully",
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       Error: `Internal server error: ${error.message}`,
//       route: "users/upload-image",
//     });
//   }
// };

// export const getMonthlyRegistrations = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   try {
//     const registrations = await UserInstance.findAll({
//       attributes: [
//         [
//           Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt")),
//           "month",
//         ],
//         [Sequelize.fn("COUNT", Sequelize.col("id")), "totalRegistrations"],
//       ],
//       group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt"))],
//       order: [
//         [
//           Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt")),
//           "ASC",
//         ],
//       ],
//     });

//     const formattedData = registrations.map((record: any) => ({
//       month: record.getDataValue("month"),
//       totalRegistrations: record.getDataValue("totalRegistrations"),
//     }));

//     return res.status(200).json({ data: formattedData });
//   } catch (error: any) {
//     console.error("Error fetching monthly registrations:", error.message);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };

// export const allUsers = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const registrations = await UserInstance.findAll({
//       attributes: {
//         exclude: ["password", "totalEarnings", "userValidationSecret"],
//       },
//     });

//     return res
//       .status(200)
//       .json({ count: registrations.length, data: registrations });
//   } catch (error: any) {
//     console.error("Error fetching monthly registrations:", error.message);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// };
// src/middlewares/auth.ts import { Response, NextFunction } from "express";
// import jwt, { JwtPayload } from "jsonwebtoken";
// import { UserAttribute, UserInstance } from "../models/userModel";

// export const auth = async (
//   req: JwtPayload,
//   res: Response,
//   next: NextFunction
// ): Promise<any> => {
//   try {
//     const token = req.header("Authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return res.status(401).json({ error: "Authentication token is missing" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
//     const { id } = decoded;
//     if (!id) {
//       return res.status(401).json({ error: "Invalid token structure" });
//     }

//     const user = (await UserInstance.findOne({
//       where: { id },
//     })) as unknown as UserAttribute;

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (!user.isVerified) {
//       return res.status(403).json({ error: "User is not verified" });
//     }
//     req.user = id;

//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Invalid or expired token" });
//   }
// };

// export const adminAuth = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ): Promise<any> => {
//   try {
//     const user = (await UserInstance.findOne({
//       where: { id: req.user },
//     })) as unknown as UserAttribute;

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     if (user.role !== "admin") {
//       return res.status(403).json({ error: "Access denied. Admins only." });
//     }

//     next();
//   } catch (error: any) {
//     return res.status(500).json({
//       error: "An error occurred during role verification",
//       details: error.message,
//     });
//   }
// };
// src/utilities/multer.ts import multer from "multer";
// import { v2 as cloudinary } from "cloudinary";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import { CLOUDINARY_URL } from "../config";

// cloudinary.config({
//   cloudinary_url: CLOUDINARY_URL,
// });

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: async (req, file) => {
//     return {
//       folder: "",
//       allowedFormats: ["jpg", "png", "pdf"],
//     };
//   },
// });

// const upload = multer({ storage: storage });

// export async function uploadICSFileToCloudinary(filename: string, icsContent: string): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const uploadStream = cloudinary.uploader.upload_stream(
//       {
//         resource_type: "raw", // This is the trick to upload any non-image file like `.ics`
//         public_id: `calendar/${filename}`,
//         format: "ics",
//       },
//       (error, result) => {
//         if (error) {
//           console.error("Error uploading ICS to Cloudinary:", error);
//           return reject(error);
//         }
//         resolve(result?.secure_url || "");
//       }
//     );

//     // Write the ICS content to the stream
//     uploadStream.end(Buffer.from(icsContent));
//   });
// }


// export default upload;
// src/utilities/nodemailer.ts import nodemailer, { Transporter } from "nodemailer";

// interface EmailOptions {
//   email: string;
//   subject: string;
//   message: string;
//   isHtml?: boolean;
//   attachments?: {
//     filename?: string;
//     content?: string;
//     contentType?: string;
//     encoding?: string;
//   }[];
// }

// const sendEmail = async (options: EmailOptions): Promise<void> => {
//   const transporter: Transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number(process.env.SMTP_PORT),
//     // secure: false,
//     auth: {
//       user: process.env.SMTP_EMAIL,
//       pass: process.env.SMTP_PASSWORD,
//     },
//   });

//   const message: any = {
//     from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     isHtml: options.isHtml,
//     attachments: options.attachments,
//   };

//   const info = await transporter.sendMail(message);

//   console.log("Message sent: %s", info.messageId);
// };

// export default sendEmail;
// src/utilities/sendMail.ts import { createClient } from "smtpexpress";
// import {
//   SMTPEXPRESS_PROJECT_ID,
//   SMTPEXPRESS_PROJECT_SECRET,
// } from "../config";

// interface EmailOptions {
//   email: string;
//   name?: string;
//   subject: string;
//   message: string;
//   isHtml?: boolean;
// }

// const smtpexpressClient = createClient({
//   projectId: SMTPEXPRESS_PROJECT_ID,
//   projectSecret: SMTPEXPRESS_PROJECT_SECRET,
// });

// const sendEmail = async (options: EmailOptions): Promise<void> => {
//   const emailData: any = {
//     recipients: { email: options.email, name: options.name || "User" },
//     sender: {
//       name: process.env.FROM_NAME,
//       email: process.env.FROM_EMAIL,
//     },
//     subject: options.subject,
//     message: options.isHtml ? undefined : options.message,
//     htmlMessage: options.isHtml ? options.message : undefined,
//   };

//   try {
//     await smtpexpressClient.sendApi.sendMail(emailData);
//   } catch (err: any) {
//     console.error(
//       "SMTPExpress sendMail failed:",
//       err.response?.data || err.message || err
//     );
//     throw new Error("Email sending failed");
//   }
// };

// export default sendEmail; src/utilities/sendTicketEmail.ts import { uploadICSFileToCloudinary } from "./multer";
// import sendEmail from "./sendMail";

// function generateGoogleCalendarLink(event: any) {
//   const startDate = new Date(event.date).toISOString().replace(/[-:.]/g, "");
//   const endDate = startDate; // Assuming it's a one-day event

//   return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
//     event.title
//   )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
//     event.description || ""
//   )}&location=${encodeURIComponent(event.location || "")}&sf=true&output=xml`;
// }

// function generateICS(event: any): string {
//   const formatDateForICS = (date: Date) =>
//     date
//       .toISOString()
//       .replace(/[-:]/g, "")
//       .replace(/\.\d{3}Z$/, "");

//   const startDate = formatDateForICS(new Date(event.date));
//   const endDate = formatDateForICS(new Date(event.date)); // Update if multi-day

//   return `BEGIN:VCALENDAR
//           VERSION:2.0
//           BEGIN:VEVENT
//           SUMMARY:${event.title}
//           DESCRIPTION:${event.description || ""}
//           DTSTART:${startDate}
//           DTEND:${endDate}
//           LOCATION:${event.location || ""}
//           END:VEVENT
//           END:VCALENDAR`;
// }

// export const sendTicketEmail = async (
//   name: string,
//   email: string,
//   event: any,
//   ticket: any,
//   totalAmount: number,
//   currency: string,
//   ticketPrice?: number,
//   // virtualLink?: string
// ): Promise<void> => {
//   try {
//     // Generate calendar links
//     const googleCalendarLink = generateGoogleCalendarLink(event);
//     const icsContent = generateICS(event);
//     const icsUrl = await uploadICSFileToCloudinary(
//       `event-${event.id}.ics`,
//       icsContent
//     );

//     // Construct email message
//     // const mailMessage = `
//     //   <p>Dear ${name},</p>
//     //   <p>Thank you for purchasing a ticket to "${event.title}".</p>
//     //   <p>Event Details:</p>
//     //   <ul>
//     //     <li><strong>Event:</strong> ${event.title}</li>
//     //     <li><strong>Ticket Type:</strong> ${ticket.ticketType}</li>
//     //     <li><strong>Price:</strong> ${currency} ${totalAmount.toFixed(2)}</li>
//     //     <li><strong>Date:</strong> ${new Date(
//     //       event.date
//     //     ).toLocaleDateString()}</li>
//     //   </ul>
//     //   <p>Your QR Code:</p>
//     //   <img src="${ticket.qrCode}" style="max-width: 200px;">
//     //   <p><a href="${
//     //     ticket.qrCode
//     //   }" download="ticket_qr.png">Download QR Code</a></p>
//     //   <p><strong>Add to Calendar:</strong></p>
//     //   <ul>
//     //     <li><a href="${googleCalendarLink}" target="_blank">Google Calendar</a></li>
//     //     <li><a href="${icsUrl}" target="_blank">Outlook/Apple Calendar</a></li>
//     //   </ul>
//     //   <p>Best regards,<br>Event Team</p>
//     // `;

//     const mailMessage = `
//   <div style="font-family: 'Georgia', serif; line-height: 1.8; color: #444; background-color: #fafafa; padding: 40px;">
//     <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); border: 1px solid #eee;">
//       <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 24px; font-weight: 600; text-align: center; letter-spacing: -0.5px;">
//         Thank You, ${name}!
//       </h1>
//       <p style="margin: 16px 0; font-size: 16px; color: #555; text-align: center;">
//         We’re thrilled to welcome you to <strong style="color: #2c3e50;">${
//           event.title
//         }</strong>. Below are the details of your ticket and event information.
//       </p>

//       <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
//         <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 16px; font-weight: 500; text-align: center;">
//           Event Details
//         </h2>
//         <ul style="margin: 0; padding: 0; list-style: none;">
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Event:</strong> ${
//               event.title
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Ticket Type:</strong> ${
//               ticket.ticketType
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Virtual Link:</strong> ${
//               event.virtualLink
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Virtual Password:</strong> ${
//               event.virtualPassword
//             }
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Amount Paid:</strong> ${currency} ${totalAmount.toFixed(
//       2
//     )}
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Ticket Price:</strong> ${currency} ${ticketPrice}
//           </li>
//           <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//             <strong style="color: #2c3e50; display: inline-block; width: 100px;">Date:</strong> ${new Date(
//               event.date
//             ).toLocaleDateString()}
//           </li>
//           ${
//             event.location
//               ? `
//             <li style="margin-bottom: 12px; font-size: 16px; color: #555;">
//               <strong style="color: #2c3e50; display: inline-block; width: 100px;">Location:</strong> ${event.location}
//             </li>
//           `
//               : ""
//           }
//         </ul>
//       </div>

//       <div style="text-align: center; margin: 32px 0;">
//         <p style="margin: 16px 0; font-size: 18px; color: #2c3e50; font-weight: 500;">
//           Your QR Code
//         </p>
//         <img src="${
//           ticket.qrCode
//         }" alt="QR Code" style="max-width: 200px; height: auto; border: 1px solid #ddd; border-radius: 8px; padding: 12px; background: #fff;">
//         <p style="margin: 16px 0;">
//           <a href="${
//             ticket.qrCode
//           }" download="ticket_qr.png" style="display: inline-block; padding: 12px 24px; margin: 16px 0; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
//             Download QR Code
//           </a>
//         </p>
//       </div>

//       <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
//         <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 16px; font-weight: 500; text-align: center;">
//           Add to Calendar
//         </h2>
//         <p style="margin: 16px 0; font-size: 16px; color: #555; text-align: center;">
//           Don’t forget to add the event to your calendar:
//         </p>
//         <div style="text-align: center;">
//           <a href="${googleCalendarLink}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 8px; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
//             Google Calendar
//           </a>
//           <a href="${icsUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; margin: 8px; font-size: 16px; color: #fff; background-color: #2c3e50; border-radius: 6px; text-decoration: none; text-align: center; transition: background-color 0.3s;">
//             Outlook/Apple Calendar
//           </a>
//         </div>
//       </div>

//       <div style="margin-top: 32px; font-size: 14px; color: #777; text-align: center;">
//         <p style="margin: 16px 0;">
//           Best regards,<br>
//           <strong style="color: #2c3e50;">The Event Team</strong>
//         </p>
//         <p style="margin: 16px 0;">
//           Follow us on 
//           <a href="https://twitter.com/eventteam" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Twitter</a> 
//           or 
//           <a href="https://facebook.com/eventteam" target="_blank" style="color: #2c3e50; text-decoration: none; font-weight: 500;">Facebook</a> 
//           for updates!
//         </p>
//       </div>
//     </div>
//   </div>
// `;

//     // Send the email
//     await sendEmail({
//       email,
//       subject: `Your Ticket for "${event.title}"`,
//       message: mailMessage,
//     });
//   } catch (err: any) {
//     console.error("Error sending ticket email:", err.message);
//     throw err;
//   }
// };

// // import { Request, Response } from "express";
// // import axios from "axios";
// // import { TicketInstance } from "../models/ticketModel";
// // import { v4 as uuidv4 } from "uuid";
// // import {
// //   ACCOUNT_OWNER_ID,
// //   db,
// //   FLUTTERWAVE_BASE_URL,
// //   FLUTTERWAVE_HASH_SECRET,
// //   FLUTTERWAVE_PUBLIC_KEY,
// //   FLUTTERWAVE_SECRET_KEY,
// //   FRONTEND_URL,
// //   generateTicketSignature,
// //   PAYSTACK_BASE_URL,
// //   PAYSTACK_SECRET_KEY,
// // } from "../config";
// // import TransactionInstance from "../models/transactionModel";
// // import EventInstance from "../models/eventModel";
// // import { UserAttribute, UserInstance } from "../models/userModel";
// // import QRCode from "qrcode";
// // import { v2 as cloudinary } from "cloudinary";
// // import { uploadICSFileToCloudinary } from "./multer";
// // import sendEmail from "./sendMail";

// // cloudinary.config({
// //   cloudinary_url: process.env.CLOUDINARY_URL,
// // });

// // // Function to generate Google Calendar link
// // const generateGoogleCalendarLink = (event: any): string => {
// //   const startDate = new Date(event.date).toISOString().replace(/[-:.]/g, "");
// //   const endDate = startDate; // Assuming it's a one-day event
// //   return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
// //     event.title
// //   )}&dates=${startDate}/${endDate}&details=${encodeURIComponent(
// //     event.description || ""
// //   )}&location=${encodeURIComponent(event.location || "")}&sf=true&output=xml`;
// // };

// // // Function to generate ICS content
// // const generateICS = (event: any): string => {
// //   const formatDateForICS = (date: Date) =>
// //     date
// //       .toISOString()
// //       .replace(/[-:]/g, "")
// //       .replace(/\.\d{3}Z$/, "");

// //   const startDate = formatDateForICS(new Date(event.date));
// //   const endDate = formatDateForICS(new Date(event.date)); // Update if multi-day

// //   return `BEGIN:VCALENDAR
// //           VERSION:2.0
// //           BEGIN:VEVENT
// //           SUMMARY:${event.title}
// //           DESCRIPTION:${event.description || ""}
// //           DTSTART:${startDate}
// //           DTEND:${endDate}
// //           LOCATION:${event.location || ""}
// //           END:VEVENT
// //           END:VCALENDAR`;
// // };

// // export const sendTicketEmail = async (
// //   recipients: { name: string; email: string }[],
// //   event: any,
// //   ticket: any,
// //   totalAmount: number,
// //   currency: string
// // ): Promise<void> => {
// //   try {
// //     const googleCalendarLink = generateGoogleCalendarLink(event);
// //     const icsContent = generateICS(event);
// //     const icsUrl = await uploadICSFileToCloudinary(
// //       `event-${event.id}.ics`,
// //       icsContent
// //     );

// //     // Construct email message for each recipient
// //     for (const recipient of recipients) {
// //       const mailMessage = `
// //         <div style="font-family: 'Georgia', serif; line-height: 1.8; color: #444; background-color: #fafafa; padding: 40px;">
// //           <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); border: 1px solid #eee;">
// //             <h1 style="font-size: 28px; color: #2c3e50; margin-bottom: 24px; font-weight: 600; text-align: center;">
// //               Thank You, ${recipient.name}!
// //             </h1>
// //             <p style="margin: 16px 0; font-size: 16px; color: #555; text-align: center;">
// //               We’re thrilled to welcome you to <strong>${event.title}</strong>. Below are the details of your ticket.
// //             </p>
// //             <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 24px 0;">
// //               <h2 style="font-size: 22px; color: #2c3e50; margin-bottom: 16px; font-weight: 500; text-align: center;">
// //                 Event Details
// //               </h2>
// //               <ul style="margin: 0; padding: 0; list-style: none;">
// //                 <li><strong>Event:</strong> ${event.title}</li>
// //                 <li><strong>Ticket Type:</strong> ${ticket.ticketType}</li>
// //                 <li><strong>Amount Paid:</strong> ${currency} ${totalAmount.toFixed(2)}</li>
// //                 <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
// //                 ${event.location ? `<li><strong>Location:</strong> ${event.location}</li>` : ""}
// //               </ul>
// //             </div>
// //             <div style="text-align: center;">
// //               <p style="margin: 16px 0; font-size: 18px; color: #2c3e50; font-weight: 500;">
// //                 Your QR Code
// //               </p>
// //               <img src="${ticket.qrCode}" style="max-width: 200px;">
// //             </div>
// //             <p style="text-align: center;">
// //               <a href="${googleCalendarLink}">Add to Google Calendar</a>
// //               <br>
// //               <a href="${icsUrl}">Download ICS File</a>
// //             </p>
// //           </div>
// //         </div>
// //       `;

// //       // Send email logic here (e.g., using nodemailer)
// //       await sendEmail({
// //         email: recipient.email,
// //         subject: `Your Ticket for "${event.title}"`,
// //         message: mailMessage,
// //       });
// //     }
// //   } catch (err: any) {
// //     console.error("Error sending ticket email:", err.message);
// //     throw err;
// //   }
// // };
// src/utilities/validation.ts import Joi, { ObjectSchema } from "joi";

// export const userRegistrationSchema = Joi.object({
//   phone: Joi.string()
//     .pattern(/^\+?\d{10,15}$/)
//     .required()
//     .messages({
//       "string.empty": "Phone number is required",
//       "string.pattern.base": "Phone number must be 10-15 digits",
//     }),
//   fullName: Joi.string().min(3).max(50).required().messages({
//     "string.empty": "Name is required",
//     "string.min": "Name must be at least 3 characters",
//     "string.max": "Name must be at most 50 characters",
//   }),
//   email: Joi.string().email().required().messages({
//     "string.empty": "Email is required",
//     "string.email": "Email must be a valid email address",
//   }),
//   password: Joi.string().min(5).max(30).required().messages({
//     "string.empty": "Password is required",
//     "string.min": "Password must be at least 5 characters",
//     "string.max": "Password must be at most 30 characters",
//   }),
//   businessName: Joi.string().allow(null).optional().messages({
//     "string.empty": "Business name cannot be empty",
//   }),
//   companyWebsite: Joi.string().uri().allow(null).optional().messages({
//     "string.uri": "Company website must be a valid URL",
//   }),
//   address: Joi.string().allow(null).optional().messages({
//     "string.empty": "Address cannot be empty",
//   }),
//   timezone: Joi.string().allow(null).optional().messages({
//     "string.empty": "Timezone cannot be empty",
//   }),
// });

// export const validate = <T>(
//   data: T,
//   schema: ObjectSchema
// ): { value: T; error?: string } => {
//   const { error, value } = schema.validate(data, {
//     abortEarly: false,
//     stripUnknown: true,
//   });

//   if (error) {
//     return {
//       value,
//       error: error.details.map((err: any) => err.message).join(", "),
//     };
//   }

//   return { value };
// };

// export const eventValidationSchema = Joi.object({
//   title: Joi.string().required(),
//   description: Joi.string().required(),
//   date: Joi.date().required(),
//   location: Joi.string().required(),
//   time: Joi.string().required(),
//   venue: Joi.string().required(),
//   ticketType: Joi.string().required(),
//   socialMediaLinks: Joi.alternatives().try(
//     Joi.object().optional(),
//     Joi.string().optional()
//   ),
//   isVirtual: Joi.boolean().required(),
//   virtualLink: Joi.string()
//     .uri()
//     .when("isVirtual", {
//       is: true,
//       then: Joi.required().messages({
//         "any.required": "Virtual link is required when event is virtual",
//         "string.uri": "Virtual link must be a valid URL",
//       }),
//       otherwise: Joi.optional(),
//     }),
//   virtualPassword: Joi.string().when("isVirtual", {
//     is: true,
//     then: Joi.required().messages({
//       "any.required": "Virtual password is required when event is virtual",
//     }),
//     otherwise: Joi.optional(),
//   }),
// });

// export const updateEventValidationSchema = Joi.object({
//   title: Joi.string().optional(),
//   description: Joi.string().optional(),
//   date: Joi.date().optional(),
//   location: Joi.string().optional(),
//   time: Joi.string().optional(),
//   venue: Joi.string().optional(),
//   image: Joi.string().optional(),
//   gallery: Joi.array().items(Joi.string()).optional(),
//   socialMediaLinks: Joi.alternatives()
//     .try(Joi.object().optional(), Joi.string().optional())
//     .optional(),
//   ticketType: Joi.string().optional(),
// });
