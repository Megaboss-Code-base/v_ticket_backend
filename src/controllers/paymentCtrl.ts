import { Request, Response } from "express";
import axios from "axios";
import { TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import {
  ACCOUNT_OWNER_ID,
  db,
  FLUTTERWAVE_BASE_URL,
  FLUTTERWAVE_HASH_SECRET,
  FLUTTERWAVE_PUBLIC_KEY,
  FLUTTERWAVE_SECRET_KEY,
  FRONTEND_URL,
  generateTicketSignature,
  PAYSTACK_BASE_URL,
  PAYSTACK_SECRET_KEY,
  validatePaystackWebhook,
} from "../config";
import TransactionInstance from "../models/transactionModel";
import EventInstance from "../models/eventModel";
import { UserInstance } from "../models/userModel";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import sendEmail from "../utilities/sendMail";
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_URL } from "../config";
import { sendTicketEmail } from "../utilities/sendTicketEmail";

cloudinary.config({
  cloudinary_url: CLOUDINARY_URL,
});

const Flutterwave = require("flutterwave-node-v3");
const flw = new Flutterwave(FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY);

const generateReference = () => `unique-ref-${Date.now()}`;

const getCustomFieldValue = (
  customFields: any[],
  variableName: string
): string => {
  const field = customFields.find(
    (field) => field.variable_name === variableName
  );
  return field ? field.value : "";
};

console.log("PAYSTACK_SECRET_KEY",PAYSTACK_SECRET_KEY)

export const purchaseTicket = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { eventId } = req.params;
  const { ticketType, currency, email, phone, fullName, attendees, quantity } =
    req.body;

  if (!email || !phone || !currency || !fullName || !quantity || quantity < 1) {
    return res.status(400).json({
      error: "Provide all required fields and a valid quantity",
    });
  }

  if (!attendees && quantity !== 1) {
    return res.status(400).json({
      error: "Since no additional attendee, ticket quantity must be 1.",
    });
  }

  if (
    attendees &&
    (!Array.isArray(attendees) || attendees.length !== quantity - 1)
  ) {
    return res.status(400).json({
      error: "The number of attendees must match the ticket quantity.",
    });
  }

  try {
    const event = await EventInstance.findOne({ where: { id: eventId } });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const eventDate = new Date(event.date);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const eventDateString = eventDate.toISOString().split("T")[0];
    const todayDateString = today.toISOString().split("T")[0];

    if (eventDateString < todayDateString) {
      return res.status(400).json({
        error: "Cannot purchase tickets for expired events",
      });
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

    const recipients = [{ name: fullName, email }, ...(attendees || [])];

    const ticketPrice = parseFloat(ticketInfo.price);
    const ticketId = uuidv4();
    const signature = generateTicketSignature(ticketId);
    const qrCodeData = `${FRONTEND_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;

    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);

    const cloudinaryResult = await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "qrcodes", resource_type: "image" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          resolve(result?.url || "");
        }
      );

      uploadStream.end(qrCodeBuffer);
    });

    if (ticketPrice === 0) {
      const ticket = await TicketInstance.create({
        id: ticketId,
        email,
        phone,
        fullName,
        eventId: event.id,
        ticketType,
        price: 0,
        purchaseDate: new Date(),
        qrCode: cloudinaryResult,
        paid: true,
        currency,
        attendees: attendees || [{ name: fullName, email }],
        validationStatus: "valid",
        isScanned: false,
      });

      ticketInfo.quantity = (Number(ticketInfo.quantity) - quantity).toString();
      ticketInfo.sold = (Number(ticketInfo.sold || 0) + quantity).toString();

      await EventInstance.update(
        { ticketType: event.ticketType },
        { where: { id: event.id } }
      );

      await sendTicketEmail(fullName, email, event, ticket, 0, currency, 0);

      return res.status(200).json({
        message: "Ticket successfully created for free event",
        ticketId: ticket.id,
        redirect: FRONTEND_URL,
        ticket,
      });
    }

    // For paid tickets
    const totalPrice = ticketPrice * quantity;

    const ticket = await TicketInstance.create({
      id: ticketId,
      email,
      phone,
      fullName,
      eventId: event.id,
      ticketType,
      price: totalPrice,
      purchaseDate: new Date(),
      qrCode: cloudinaryResult,
      paid: false,
      currency,
      attendees: attendees || [{ name: fullName, email }],
      validationStatus: "valid",
      isScanned: false,
    });

    const eventOwner = await UserInstance.findOne({
      where: { id: event.userId },
    });

    if (!eventOwner) {
      return res.status(404).json({ error: "Event owner not found" });
    }

    const tx_ref = generateReference();
    try {
      const paystackResponse = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        {
          email,
          amount: totalPrice * 100, // Paystack expects amount in kobo/cents
          callback_url: `${FRONTEND_URL}/success?ticketId=${ticketId}`,
          metadata: {
            custom_fields: [
              {
                display_name: "Ticket ID",
                variable_name: "ticket_id",
                value: ticketId,
              },
              {
                display_name: "Quantity",
                variable_name: "quantity",
                value: quantity.toString(),
              },
              {
                display_name: "Full Name",
                variable_name: "full_name",
                value: fullName,
              },
              {
                display_name: "Ticket Price",
                variable_name: "ticket_price",
                value: ticketPrice,
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        paystackResponse.data &&
        paystackResponse.data.data &&
        paystackResponse.data.data.authorization_url
      ) {
        return res.status(200).json({
          link: paystackResponse.data.data.authorization_url,
          ticketId,
        });
      } else {
        throw new Error("Error creating Paystack payment link");
      }
    } catch (paystackError: any) {
      console.log(`Paystack error:`, paystackError.message);
      return res.status(500).json({
        error: "Failed to create payment link with Paystack",
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to create ticket",
      details: error.message,
    });
  }
};

export const handleUnifiedWebhook = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const paystackSignature = Array.isArray(req.headers["x-paystack-signature"])
      ? req.headers["x-paystack-signature"][0]
      : req.headers["x-paystack-signature"];

    if (!paystackSignature) {
      return res.status(401).json({ error: "Missing Paystack signature" });
    }

    const payload = req.body;
    const payloadString = JSON.stringify(req.body);

    if (validatePaystackWebhook(paystackSignature, payloadString)) {
      if (req.body.event === "charge.success") {
        const { id, reference, amount, currency, metadata } = payload.data;
        const { email } = payload.data.customer;
        const totalAmount = amount / 100; // Convert from kobo to Naira

        const customFields = metadata?.custom_fields || [];
        const ticketId = getCustomFieldValue(customFields, "ticket_id");
        const fullName = getCustomFieldValue(customFields, "full_name");

        await TransactionInstance.create({
          id: payload.data.id.toString(),
          email,
          fullName,
          ticketId,
          paymentStatus: "successful",
          totalAmount,
          paymentReference: reference,
          currency,
        });

        return res.status(200).json({
          message: "Paystack webhook processed successfully",
        });
      }

      return res.status(400).json({
        error: "Invalid Paystack webhook event",
      });
    }

    return res.status(401).json({ error: "Invalid webhook signature" });
  } catch (error: any) {
    console.error("Error processing webhook:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};


export const handlePaymentVerification = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { reference } = req.body;

  if (!reference) {
    return res.status(400).json({ error: "Missing payment reference" });
  }

  try {
    // VERIFY TRANSACTION FROM PAYSTACK
    const {
      data: { data: paymentDetails },
    } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (paymentDetails.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Extract details
    const totalAmount = paymentDetails.amount / 100;
    const email = paymentDetails.customer.email;
    const paymentReference = paymentDetails.reference;
    const currency = paymentDetails.currency;
    const id = paymentDetails.id;

    const ticketId = getCustomFieldValue(
      paymentDetails.metadata?.custom_fields,
      "ticket_id"
    );
    const name = getCustomFieldValue(
      paymentDetails.metadata?.custom_fields,
      "full_name"
    );
    const quantity = parseInt(
      getCustomFieldValue(
        paymentDetails.metadata?.custom_fields,
        "quantity"
      ) || "1",
      10
    );
    const ticketPrice = parseInt(
      getCustomFieldValue(
        paymentDetails.metadata?.custom_fields,
        "ticket_price"
      ) || "1",
      10
    );

    const [existingTransaction, existingTicket] = await Promise.all([
      TransactionInstance.findOne({
        where: { paymentReference, paymentStatus: "successful" },
      }),
      TicketInstance.findOne({
        where: { id: ticketId, paid: true, validationStatus: "valid" },
      }),
    ]);

    if (existingTransaction && existingTicket) {
      return res.status(400).json({ error: "Payment already processed." });
    }

    const transaction = await db.transaction();
    try {
      if (!existingTransaction) {
        await TransactionInstance.create(
          {
            id,
            email,
            fullName: name,
            ticketId,
            paymentStatus: "successful",
            totalAmount,
            paymentReference,
            currency,
          },
          { transaction }
        );
      }

      const ticket = await TicketInstance.findOne({
        where: { id: ticketId },
        transaction,
      });
      if (!ticket) throw new Error("Ticket not found");

      const event = await EventInstance.findOne({
        where: { id: ticket.eventId },
        transaction,
      });
      if (!event) throw new Error("Event not found");

      ticket.validationStatus = "valid";
      ticket.paid = true;
      ticket.flwRef = paymentReference;
      await ticket.save({ transaction });

      const ticketType = event.ticketType.find(
        (t) => t.name === ticket.ticketType
      );

      if (!ticketType) throw new Error("Ticket type not found");

      const availableQuantity = parseInt(ticketType.quantity || "0");
      const soldCount = parseInt(ticketType.sold || "0");

      if (availableQuantity < quantity) {
        throw new Error("Not enough tickets available");
      }

      ticketType.sold = (soldCount + quantity).toString();
      ticketType.quantity = (availableQuantity - quantity).toString();

      await EventInstance.update(
        { ticketType: event.ticketType },
        { where: { id: event.id }, transaction }
      );

      const eventOwner = await UserInstance.findOne({
        where: { id: event.userId },
        transaction,
      });

      if (eventOwner) {
        await NotificationInstance.create(
          {
            id: uuidv4(),
            title: `Ticket purchased for "${event.title}"`,
            message: `A ticket was purchased for "${event.title}". Amount: ${currency} ${(totalAmount * 0.98).toFixed(
              2
            )}. Purchaser: ${ticket.fullName}.`,
            userId: event.userId,
            isRead: false,
          },
          { transaction }
        );
      }

      // const appOwnerEarnings = parseFloat((totalAmount * 0.0983).toFixed(2));

      // await UserInstance.increment(
      //   { totalEarnings: appOwnerEarnings },
      //   { where: { id: ACCOUNT_OWNER_ID }, transaction }
      // );

      await sendTicketEmail(
        name,
        email,
        event,
        ticket,
        totalAmount,
        currency,
        ticketPrice
      );

      await transaction.commit();
      res.status(200).json({ message: "Payment verified and processed" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err: any) {
    console.error("Payment verification error:", err.message);
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};
