import { Request, Response } from "express";
import axios from "axios";
import { TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import {
  ACCOUNT_OWNER_ID,
  db,
  FLUTTERWAVE_BASE_URL,
  FLUTTERWAVE_HASH_SECRET,
  FLUTTERWAVE_SECRET_KEY,
  FRONTEND_URL,
  generateTicketSignature,
  validateFlutterwaveWebhook,
} from "../config";
import TransactionInstance from "../models/transactionModel";
import EventInstance from "../models/eventModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import sendEmail from "../utilities/sendMail";
import { v2 as cloudinary } from "cloudinary";

const generateReference = () => `unique-ref-${Date.now()}`;

export const purchaseTicket = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const { ticketType, currency, email, phone, fullName, attendees, quantity } =
    req.body;

  if (!email || !phone || !fullName || !quantity || quantity < 1) {
    return res.status(400).json({
      error: "Provide all required fields and a valid quantity",
    });
  }

  if (!Array.isArray(attendees) || attendees.length !== quantity) {
    return res.status(400).json({
      error: "Attendees must be an array matching the ticket quantity",
    });
  }

  attendees.forEach((attendee, index) => {
    if (
      typeof attendee.name !== "string" ||
      typeof attendee.email !== "string"
    ) {
      return res.status(400).json({
        error: `Invalid attendee at index ${index}: Each attendee must have a name and email`,
      });
    }
  });

  try {
    const event = await EventInstance.findOne({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (new Date() > new Date(event.date)) {
      return res
        .status(400)
        .json({ error: "Cannot purchase tickets for expired events" });
    }

    if (!Array.isArray(event.ticketType)) {
      return res.status(400).json({ error: "Invalid ticket type structure" });
    }

    const ticketInfo = event.ticketType.find(
      (ticket) => ticket.name === ticketType
    );

    if (!ticketInfo) {
      return res.status(400).json({ error: "Invalid ticket type" });
    }

    const ticketPrice = parseFloat(ticketInfo.price);
    const totalPrice = ticketPrice * quantity;

    const tickets = await Promise.all(
      Array.from({ length: quantity }).map(async (_, i) => {
        const ticketId = uuidv4();

        const signature = generateTicketSignature(ticketId);
        const qrCodeData = `${process.env.BASE_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;
        const qrCode = await QRCode.toDataURL(qrCodeData);

        return TicketInstance.create({
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
          attendees: attendees[i],
          validationStatus: "invalid",
          isScanned: false,
        });
      })
    );

    const eventOwner = (await UserInstance.findOne({
      where: { id: event.userId },
    })) as unknown as UserAttribute;
    if (!eventOwner) {
      return res.status(404).json({ error: "Event owner not found" });
    }

    const tx_ref = generateReference();
    const ticketIds = tickets.map((t) => t.id);

    const paymentData = {
      customer: {
        name: fullName,
        email,
      },
      meta: {
        ticketIds: ticketIds.join(","),
        phone,
        fullName,
      },
      amount: totalPrice,
      currency,
      tx_ref,
      redirect_url: FRONTEND_URL,
      subaccounts: [
        {
          id: process.env.APP_OWNER_SUBACCOUNT_ID,
          transaction_split_ratio: 10,
        },
        {
          bank_account: {
            account_bank: eventOwner.account_bank,
            account_number: eventOwner.account_number,
          },
          country: eventOwner.country,
          transaction_split_ratio: 90,
        },
      ],
    };

    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data && response.data.data && response.data.data.link) {
      return res.status(200).json({ link: response.data.data.link });
    } else {
      return res.status(400).json({
        message: "Error creating payment link",
        details: response.data,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to create ticket",
      details: error.message,
    });
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const secretHash = FLUTTERWAVE_HASH_SECRET;

    const signature = req.headers["verif-hash"] || req.headers["Verif-Hash"];

    if (!signature || signature !== secretHash) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = req.body;

    if (payload.data.status === "successful") {
      const transaction = await db.transaction();

      const { email } = payload.data.customer;
      const { ticketIds, phone, fullName } = payload.meta_data;
      const totalAmount = payload.data.amount;
      const paymentReference = payload.data.flw_ref;
      const currency = payload.data.currency;

      const ticketIdsArray = ticketIds
        .split(",")
        .filter((id: any) => id.trim() !== "");
      const amountPerTicket = totalAmount / ticketIdsArray.length;

      const updatedTickets = [];
      const qrCodes = [];

      for (const ticketId of ticketIdsArray) {
        const qrCodeData = {
          ticketId,
          email,
          fullName,
        };

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
        qrCodes.push(qrCode);

        const [_, updatedTicketRecords] = await TicketInstance.update(
          {
            validationStatus: "valid",
            qrCode,
            paid: true,
            flwRef: paymentReference,
          },
          {
            where: { id: ticketId },
            returning: true,
            transaction,
          }
        );

        if (updatedTicketRecords.length > 0) {
          updatedTickets.push(updatedTicketRecords[0]);
        }

        await TransactionInstance.create(
          {
            id: uuidv4(),
            email,
            fullName,
            ticketId,
            totalAmount: amountPerTicket,
            paymentStatus: "successful",
            paymentReference,
            currency,
          },
          { transaction }
        );
      }

      if (updatedTickets.length === 0) {
        return res.status(404).json({ error: "No tickets updated" });
      }

      const event = await EventInstance.findOne({
        where: { id: updatedTickets[0].eventId },
      });

      const appOwnerSplit = (totalAmount * 9.85) / 100;
      const myId = ACCOUNT_OWNER_ID;
      await UserInstance.increment("totalEarnings", {
        by: appOwnerSplit,
        where: { id: myId },
      });

      const eventOwner = await UserInstance.findOne({
        where: { id: event?.userId },
      });

      if (eventOwner) {
        const myPrice = parseFloat(
          (amountPerTicket * ticketIdsArray.length * (88.65 / 100)).toFixed(2)
        );

        await NotificationInstance.create(
          {
            id: uuidv4(),
            title: `Tickets purchased for your event "${event?.title}"`,
            message: `Tickets for your event titled "${event?.title}" have been purchased. Amount paid: ${myPrice}. Purchaser: ${fullName}.`,
            userId: event!.userId,
            isRead: false,
          },
          { transaction }
        );
      }

      const mailSubject = `Your Tickets for "${event?.title}"`;
      const mailMessage = `
        Dear ${fullName},

        Thank you for purchasing tickets for the event "${event?.title}".
        Here are your ticket details:

        - Event: ${event?.title}
        - Tickets: ${ticketIdsArray.length}
        - Total Price: ${currency} ${totalAmount.toFixed(2)}
        - Date: ${new Date(event!.date).toLocaleDateString()}

        Please find your ticket QR codes attached below.

        Best regards,
        The Event Team
      `;

      const attachments = qrCodes.map((qrCode, index) => ({
        filename: `ticket-${index + 1}-qr-code.png`,
        content: qrCode.split(",")[1],
        encoding: "base64",
      }));
      await sendEmail({
        email,
        subject: mailSubject,
        message: mailMessage,
        attachments,
      });
      await transaction.commit();

      return res
        .status(200)
        .send("Webhook received and transaction processed successfully");
    } else {
      return res.status(400).json({ error: "Payment was not successful" });
    }
  } catch (error: any) {
    console.error(error.message);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};

// export const handleWebhook = async (
//   req: Request,
//   res: Response
// ): Promise<any> => {
//   const payload = req.body;
//   const signature = req.headers["verif-hash"] as string;

//   if (!signature || !validateFlutterwaveWebhook(JSON.stringify(payload), signature)) {
//     return res.status(401).json({ error: "Invalid webhook signature" });
//   }

//   if (payload.data.status !== "successful") {
//     return res.status(400).json({ error: "Payment was not successful" });
//   }

//   const transaction = await db.transaction();
//   try {
//     const { email } = payload.data.customer;
//     const { ticketIds, phone, fullName } = payload.meta_data;
//     const totalAmount = payload.data.amount;
//     const paymentReference = payload.data.flw_ref;
//     const currency = payload.data.currency;

//     const ticketIdsArray = ticketIds
//       .split(",")
//       .filter((id: any) => id.trim() !== "");

//     const amountPerTicket = totalAmount / ticketIdsArray.length;

//     const updatedTickets = [];
//     const qrCodes = [];

//     for (const ticketId of ticketIdsArray) {
//       const qrCodeData = {
//         ticketId,
//         email,
//         fullName,
//       };

//       const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
//       qrCodes.push(qrCode);

//       const [_, updatedTicketRecords] = await TicketInstance.update(
//         {
//           validationStatus: "valid",
//           qrCode,
//           paid: true,
//           flwRef: paymentReference,
//         },
//         { where: { id: ticketId }, returning: true, transaction }
//       );

//       if (updatedTicketRecords.length > 0) {
//         updatedTickets.push(updatedTicketRecords[0]);
//       }

//       await TransactionInstance.create(
//         {
//           id: uuidv4(),
//           email,
//           fullName,
//           ticketId,
//           totalAmount: amountPerTicket,
//           paymentStatus: "successful",
//           paymentReference,
//           currency,
//         },
//         { transaction }
//       );
//     }

//     if (updatedTickets.length === 0) {
//       await transaction.rollback();
//       return res.status(404).json({ error: "No tickets updated" });
//     }

//     const event = await EventInstance.findOne({
//       where: { id: updatedTickets[0].eventId },
//     });

//     const appOwnerSplit = (totalAmount * 9.85) / 100;
//     await UserInstance.increment("totalEarnings", {
//       by: appOwnerSplit,
//       where: { id: ACCOUNT_OWNER_ID },
//       transaction,
//     });

//     const eventOwner = await UserInstance.findOne({
//       where: { id: event?.userId },
//     });

//     if (eventOwner) {
//       const myPrice = parseFloat(
//         (amountPerTicket * ticketIdsArray.length * (88.65 / 100)).toFixed(2)
//       );

//       await NotificationInstance.create(
//         {
//           id: uuidv4(),
//           title: `Tickets purchased for your event "${event?.title}"`,
//           message: `Tickets for your event titled "${event?.title}" have been purchased. Amount paid: ${myPrice}. Purchaser: ${fullName}.`,
//           userId: event!.userId,
//           isRead: false,
//         },
//         { transaction }
//       );
//     }

//     const mailSubject = `Your Tickets for "${event?.title}"`;
//     const mailMessage = `
//       Dear ${fullName},

//       Thank you for purchasing tickets for the event "${event?.title}".
//       Here are your ticket details:

//       - Event: ${event?.title}
//       - Tickets: ${ticketIdsArray.length}
//       - Total Price: ${currency} ${totalAmount.toFixed(2)}
//       - Date: ${new Date(event!.date).toLocaleDateString()}

//       Please find your ticket QR codes attached below.

//       Best regards,
//       The Event Team
//     `;

//     const attachments = qrCodes.map((qrCode, index) => ({
//       filename: `ticket-${index + 1}-qr-code.png`,
//       content: qrCode.split(",")[1],
//       encoding: "base64",
//     }));

//     await sendEmail({
//       email,
//       subject: mailSubject,
//       message: mailMessage,
//       attachments,
//     });

//     await transaction.commit();
//     return res
//       .status(200)
//       .send("Webhook received and transaction processed successfully");
//   } catch (error: any) {
//     await transaction.rollback();
//     return res
//       .status(500)
//       .json({ error: "Internal server error", details: error.message });
//   }
// };
