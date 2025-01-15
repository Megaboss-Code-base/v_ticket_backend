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
    return res
      .status(400)
      .json({ error: "Provide all required fields and a valid quantity" });
  }

  if (
    attendees &&
    (!Array.isArray(attendees) || attendees.length !== quantity - 1)
  ) {
    return res.status(400).json({
      error: "Attendees must match the ticket quantity",
    });
  }

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

    if (Number(ticketInfo.quantity) < quantity) {
      return res.status(400).json({
        error: `Only ${ticketInfo.quantity} tickets are available for the selected type`,
      });
    }

    const ticketPrice = parseFloat(ticketInfo.price);
    const totalPrice = ticketPrice * quantity;

    const ticketId = uuidv4();

    const signature = generateTicketSignature(ticketId);
    const qrCodeData = `${process.env.BASE_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    const ticket = await TicketInstance.create({
      id: ticketId,
      email,
      phone,
      fullName,
      eventId: event.id,
      ticketType,
      price: totalPrice,
      purchaseDate: new Date(),
      qrCode,
      paid: false,
      currency,
      attendees: attendees || [{ name: fullName, email }],
      validationStatus: "invalid",
      isScanned: false,
    });

    const eventOwner = (await UserInstance.findOne({
      where: { id: event.userId },
    })) as unknown as UserAttribute;

    if (!eventOwner) {
      return res.status(404).json({ error: "Event owner not found" });
    }

    const tx_ref = generateReference();

    const paymentData = {
      customer: {
        name: fullName,
        email,
      },
      meta: {
        ticketId,
        quantity,
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
      return res.status(200).json({ link: response.data.data.link, ticketId });
    } else {
      return res.status(400).json({ error: "Error creating payment link" });
    }
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: "Failed to create ticket", details: error.message });
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

      try {
        const { ticketId, quantity } = payload.meta_data;
        const totalAmount = payload.data.amount;
        const paymentReference = payload.data.flw_ref;
        const currency = payload.data.currency;

        const ticket = await TicketInstance.findOne({
          where: { id: ticketId },
          transaction,
        });

        if (!ticket) {
          throw new Error("Ticket not found");
        }

        const event = await EventInstance.findOne({
          where: { id: ticket.eventId },
          transaction,
        });

        if (!event) {
          throw new Error("Event not found");
        }

        ticket.validationStatus = "valid";
        ticket.paid = true;
        ticket.flwRef = paymentReference;
        await ticket.save({ transaction });

        const ticketTypeIndex = event.ticketType.findIndex(
          (type) => type.name === ticket.ticketType
        );

        if (ticketTypeIndex >= 0) {
          const ticketType = event.ticketType[ticketTypeIndex];

          const currentSold = parseInt(ticketType.sold || "0", 10);
          const currentQuantity = parseInt(ticketType.quantity || "0", 10);

          if (currentQuantity < quantity) {
            throw new Error("Not enough tickets available");
          }

          event.ticketType[ticketTypeIndex] = {
            ...ticketType,
            sold: (currentSold + quantity).toString(),
            quantity: (currentQuantity - quantity).toString(),
          };

          await EventInstance.update(
            { ticketType: event.ticketType },
            { where: { id: event.id }, transaction }
          );
        } else {
          throw new Error("Ticket type not found in the event");
        }

        const eventOwner = await UserInstance.findOne({
          where: { id: event.userId },
          transaction,
        });

        if (eventOwner) {
          const earnings = (totalAmount * 0.9).toFixed(2);
          await NotificationInstance.create(
            {
              id: uuidv4(),
              title: `Ticket purchased for your event "${event.title}"`,
              message: `A ticket for your event titled "${event.title}" has been purchased. Amount paid: ${currency} ${earnings}. Purchaser: ${ticket.fullName}.`,
              userId: event.userId,
              isRead: false,
            },
            { transaction }
          );
        }

        const mailSubject = `Your Ticket for "${event.title}"`;
        const mailMessage = `
          Dear ${ticket.fullName},

          Thank you for purchasing a ticket for the event "${event.title}".
          Here are your ticket details:

          - Event: ${event.title}
          - Ticket Type: ${ticket.ticketType}
          - Price: ${currency} ${totalAmount.toFixed(2)}
          - Date: ${new Date(event.date).toLocaleDateString()}

          Please find your ticket QR code attached below.

          Best regards,
          The Event Team
        `;

        await sendEmail({
          email: ticket.email,
          subject: mailSubject,
          message: mailMessage,
          attachments: [
            {
              filename: `ticket-qr-code.png`,
              content: ticket.qrCode.split(",")[1],
              encoding: "base64",
            },
          ],
        });

        await transaction.commit();
        return res.status(200).send("Webhook received and transaction processed successfully");
      } catch (error: any) {
        await transaction.rollback();
        return res.status(500).json({ error: "Transaction failed", details: error.message });
      }
    } else {
      return res.status(400).json({ error: "Payment was not successful" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

