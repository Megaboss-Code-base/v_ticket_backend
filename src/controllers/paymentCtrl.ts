import { Request, Response } from "express";
import axios from "axios";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import {
  ACCOUNT_OWNER_ID,
  FLUTTERWAVE_BASE_URL,
  FLUTTERWAVE_SECRET_KEY,
  FLUUERWAVE_HASH_SECRET,
  FRONTEND_URL,
} from "../config";
import TransactionInstance from "../models/transactionModel";
import EventInstance from "../models/eventModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import sendEmail from "../utilities/sendMail";

const generateReference = () => `unique-ref-${Date.now()}`;

export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    console.log("starting....");
    const secretHash = process.env.FLUUERWAVE_HASH_SECRET;
    const signature = req.headers["verif-hash"] as string;
    if (!signature || signature !== secretHash) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = req.body;
    if (payload.data.status === "successful") {
      const { email } = payload.data.customer;
      const { ticketId, phone, fullName } = payload.meta_data;
      const totalAmount = payload.data.amount;
      const paymentReference = payload.data.flw_ref;

      const appOwnerSplit = (totalAmount * 9.85) / 100;
      const currency = payload.data.currency;

      const qrCodeData = {
        ticketId,
        email,
        fullName,
      };
  
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
  

      const [_, updatedTickets] = await TicketInstance.update(
        {
          validationStatus: "Valid",
          qrCode,
          paid: true,
          flwRef: paymentReference,
        },
        { where: { id: ticketId }, returning: true }
      );

      const updatedTicket = updatedTickets[0] as unknown as TicketAttribute;

      const event = await EventInstance.findOne({
        where: { id: updatedTicket.eventId },
      });

      await TransactionInstance.create({
        id: uuidv4(),
        email,
        fullName,
        ticketId,
        totalAmount,
        paymentStatus: "successful",
        paymentReference,
        currency,
      });
      const myId = ACCOUNT_OWNER_ID;
      await UserInstance.increment("totalEarnings", {
        by: appOwnerSplit,
        where: { id: myId },
      });

      const myPrice = parseFloat(
        (updatedTicket.price * (88.65 / 100)).toFixed(2)
      );

      await NotificationInstance.create({
        id: uuidv4(),
        title: `A ticket has been purchased for your event "${event?.title}"`,
        message: `A ticket for your event titled "${event?.title}" has been purchased. Amount paid: ${myPrice}. Purchaser: ${fullName}.`,
        userId: event!.userId,
        isRead: false,
      });

      const mailSubject = `Your Ticket for "${event!.title}"`;
      const mailMessage = `
        Dear ${fullName},

        Thank you for purchasing a ${updatedTicket.ticketType} ticket for the event "${
        event!.title
      }".
        Here are your ticket details:

        - Event: ${event!.title}
        - Ticket Type: ${updatedTicket.ticketType}
        - Price: ${currency} ${updatedTicket.price}
        - Date: ${new Date(event!.date).toLocaleDateString()}

        Please find your ticket QR code below.

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

      return res
        .status(200)
        .send("Webhook received and transaction processed successfully");
    } else {
      return res.status(400).json({ error: "Payment was not successful" });
    }
  } catch (error: any) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const purchaseTicket = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const { ticketType, currency, email, phone, fullName, attendees } = req.body;

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

    const newTicket = await TicketInstance.create({
      id: ticketId,
      email,
      phone,
      fullName,
      eventId: event.id,
      ticketType,
      price: ticketPrice,
      purchaseDate: new Date(),
      qrCode: "",
      paid: false,
      currency,
      attendees,
      validationStatus: "Invalid",
    });

    const eventOwner = (await UserInstance.findOne({
      where: {
        id: event.userId,
      },
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
        ticketId: ticketId,
        phone,
        fullName,
      },
      amount: ticketPrice,
      currency,
      tx_ref,
      redirect_url: process.env.FRONTEND_URL,
      subaccounts: [
        {
          id: process.env.APP_OWNER_SUBACCOUNT_ID,
          transaction_split_ratio: 10,
        },
        {
          bank_account: {
            account_bank: event.userId,
            account_number: event.userId,
          },
          country: eventOwner.country,
          transaction_split_ratio: 90,
        },
      ],
    };

    const response = await axios.post(
      `${process.env.FLUTTERWAVE_BASE_URL}/payments`,
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status === "success") {
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
