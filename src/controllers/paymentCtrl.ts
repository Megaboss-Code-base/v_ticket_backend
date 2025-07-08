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

    if (!validatePaystackWebhook(paystackSignature, payloadString)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    if (payload.event !== "charge.success") {
      return res.status(400).json({ error: "Invalid Paystack webhook event" });
    }

    const { id, reference, amount, currency, metadata, customer } =
      payload.data;
    const email = customer.email;
    const totalAmount = amount / 100;

    const customFields = metadata?.custom_fields || [];
    const ticketIdsString = getCustomFieldValue(customFields, "ticket_ids");
    const ticketIds = ticketIdsString ? JSON.parse(ticketIdsString) : [];
    const fullName = getCustomFieldValue(customFields, "full_name");

    if (ticketIds.length === 0) {
      return res.status(400).json({ error: "No ticket IDs found in metadata" });
    }

    // Check if payment already processed (avoid duplicates)
    const existingTransaction = await TransactionInstance.findOne({
      where: { paymentReference: reference, paymentStatus: "successful" },
    });
    if (existingTransaction) {
      return res.status(200).json({ message: "Payment already processed" });
    }

    // Begin DB transaction to ensure consistency
    const transaction = await db.transaction();

    try {
      // Create transaction record
      await TransactionInstance.create(
        {
          id: id.toString(),
          email,
          fullName,
          ticketId: ticketIds[0],
          paymentStatus: "successful",
          totalAmount,
          paymentReference: reference,
          currency,
        },
        { transaction }
      );

      await transaction.commit();

      return res
        .status(200)
        .json({ message: "Paystack webhook processed successfully" });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (error: any) {
    console.error("Error processing webhook:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

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
    if (!event) return res.status(404).json({ error: "Event not found" });

    const eventDate = new Date(event.date);
    const today = new Date();
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      return res
        .status(400)
        .json({ error: "Cannot purchase tickets for expired events" });
    }

    const ticketInfo = event.ticketType.find(
      (ticket) => ticket.name === ticketType
    );
    if (!ticketInfo)
      return res.status(400).json({ error: "Invalid ticket type" });

    if (Number(ticketInfo.quantity) < quantity) {
      return res.status(400).json({
        error: `Only ${ticketInfo.quantity} tickets are available for the selected type`,
      });
    }

    const ticketPrice = parseFloat(ticketInfo.price);
    const totalPrice = ticketPrice * quantity;

    // Arrays to collect created ticket data
    const ticketIds: string[] = [];
    const qrCodes: string[] = [];

    // Free tickets: create all tickets immediately, mark paid:true
    if (ticketPrice === 0) {
      for (let i = 0; i < quantity; i++) {
        const ticketId = uuidv4();
        const signature = generateTicketSignature(ticketId);
        const qrCodeData = `${FRONTEND_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;
        const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);

        const qrUrl = await new Promise<string>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "qrcodes", resource_type: "image" },
              (err, result) => (err ? reject(err) : resolve(result?.url || ""))
            )
            .end(qrCodeBuffer);
        });

        await TicketInstance.create({
          id: ticketId,
          email,
          phone,
          fullName: i === 0 ? fullName : attendees?.[i - 1]?.name || "Guest",
          eventId: event.id,
          ticketType,
          price: 0,
          purchaseDate: new Date(),
          qrCode: qrUrl,
          paid: true,
          currency,
          attendees: [],
          validationStatus: "valid",
          isScanned: false,
        });

        ticketIds.push(ticketId);
        qrCodes.push(qrUrl);
      }

      // Update event ticket stock
      ticketInfo.quantity = (Number(ticketInfo.quantity) - quantity).toString();
      ticketInfo.sold = (Number(ticketInfo.sold || 0) + quantity).toString();

      await EventInstance.update(
        { ticketType: event.ticketType },
        { where: { id: event.id } }
      );

      // Send tickets immediately via email
      await sendTicketEmail(
        fullName,
        email,
        event,
        ticketIds,
        qrCodes,
        attendees || [],
        totalPrice,
        currency,
        0
      );

      return res.status(200).json({
        message: "Tickets created for free event",
        ticketIds,
        redirect: FRONTEND_URL,
      });
    }

    // Paid tickets: Create tickets first with paid=false
    for (let i = 0; i < quantity; i++) {
      const ticketId = uuidv4();
      const signature = generateTicketSignature(ticketId);
      const qrCodeData = `${FRONTEND_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData);

      const qrUrl = await new Promise<string>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: "qrcodes", resource_type: "image" },
            (err, result) => (err ? reject(err) : resolve(result?.url || ""))
          )
          .end(qrCodeBuffer);
      });

      await TicketInstance.create({
        id: ticketId,
        email,
        phone,
        fullName: i === 0 ? fullName : attendees?.[i - 1]?.name || "Guest",
        eventId: event.id,
        ticketType,
        price: totalPrice / quantity,
        purchaseDate: new Date(),
        qrCode: qrUrl,
        paid: false,
        currency,
        attendees: i === 0 ? attendees : [],
        validationStatus: "invalid",
        isScanned: false,
      });

      ticketIds.push(ticketId);
      qrCodes.push(qrUrl);
    }

    // Send ticket IDs to Paystack metadata for verification after payment
    const tx_ref = generateReference();

    const paystackRes = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: totalPrice * 100,
        callback_url: `${FRONTEND_URL}/success`,
        metadata: {
          custom_fields: [
            {
              display_name: "Full Name",
              variable_name: "full_name",
              value: fullName,
            },
            {
              display_name: "Ticket IDs",
              variable_name: "ticket_ids",
              value: JSON.stringify(ticketIds),
            },
            {
              display_name: "Quantity",
              variable_name: "quantity",
              value: quantity.toString(),
            },
            {
              display_name: "Ticket Type",
              variable_name: "ticket_type",
              value: ticketType,
            },
            {
              display_name: "Event ID",
              variable_name: "event_id",
              value: eventId,
            },
            {
              display_name: "Attendees",
              variable_name: "attendees",
              value: JSON.stringify(attendees || []),
            },
            {
              display_name: "Ticket Price",
              variable_name: "ticket_price",
              value: ticketPrice.toString(),
            },
          ],
        },
      },
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    );

    return res.status(200).json({
      link: paystackRes.data.data.authorization_url,
      reference: tx_ref,
      ticketIds,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Purchase initiation failed",
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
    const {
      data: { data: payment },
    } = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    );

    if (payment.status !== "success") {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Extract custom metadata
    const customFields = payment.metadata?.custom_fields || [];
    const name = getCustomFieldValue(customFields, "full_name");
    const quantity = parseInt(
      getCustomFieldValue(customFields, "quantity") || "1",
      10
    );
    const ticketType = getCustomFieldValue(customFields, "ticket_type");
    const eventId = getCustomFieldValue(customFields, "event_id");
    const attendees = JSON.parse(
      getCustomFieldValue(customFields, "attendees") || "[]"
    );
    const ticketPrice = parseFloat(
      getCustomFieldValue(customFields, "ticket_price") || "0"
    );

    const ticketIdsString = getCustomFieldValue(customFields, "ticket_ids");
    const ticketIds = ticketIdsString ? JSON.parse(ticketIdsString) : [];
    const ticketId = ticketIds[0] || null;

    // Check if transaction & ticket already exist
    const [existingTransaction, existingTicket] = await Promise.all([
      TransactionInstance.findOne({
        where: {
          paymentReference: payment.reference,
          paymentStatus: "successful",
        },
      }),
      TicketInstance.findOne({
        where: { id: ticketId, paid: true, validationStatus: "valid" },
      }),
    ]);

    if (existingTransaction && existingTicket) {
      return res.status(400).json({ error: "Payment already processed." });
    }

    // Proceed with ticket creation and update
    const event = await EventInstance.findOne({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found" });

    const ticketTypeObj = event.ticketType.find((t) => t.name === ticketType);
    if (!ticketTypeObj || Number(ticketTypeObj.quantity) < quantity) {
      return res
        .status(400)
        .json({ error: "Insufficient ticket availability" });
    }

    const transaction = await db.transaction();
    try {
      const generatedTicketIds: string[] = [];
      const qrCodes: string[] = [];

      for (let i = 0; i < quantity; i++) {
        const newTicketId = uuidv4();
        const signature = generateTicketSignature(newTicketId);
        const qrData = `${FRONTEND_URL}/validate-ticket?ticketId=${newTicketId}&signature=${signature}`;
        const qrBuffer = await QRCode.toBuffer(qrData);

        const qrUrl = await new Promise<string>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              { folder: "qrcodes", resource_type: "image" },
              (err, result) => (err ? reject(err) : resolve(result?.url || ""))
            )
            .end(qrBuffer);
        });

        await TicketInstance.create(
          {
            id: newTicketId,
            email: payment.customer.email,
            phone: "",
            fullName: i === 0 ? name : attendees?.[i - 1]?.name || "Guest",
            eventId: event.id,
            ticketType,
            price: ticketPrice,
            purchaseDate: new Date(),
            qrCode: qrUrl,
            paid: true,
            currency: payment.currency,
            attendees: [],
            validationStatus: "valid",
            isScanned: false,
            flwRef: reference,
          },
          { transaction }
        );

        generatedTicketIds.push(newTicketId);
        qrCodes.push(qrUrl);
      }

      await TransactionInstance.create(
        {
          id: payment.id.toString(),
          email: payment.customer.email,
          fullName: name,
          ticketId: generatedTicketIds[0],
          paymentStatus: "successful",
          totalAmount: payment.amount / 100,
          paymentReference: reference,
          currency: payment.currency,
        },
        { transaction }
      );

      // Update stock
      ticketTypeObj.sold = (
        Number(ticketTypeObj.sold || 0) + quantity
      ).toString();
      ticketTypeObj.quantity = (
        Number(ticketTypeObj.quantity) - quantity
      ).toString();

      await EventInstance.update(
        { ticketType: event.ticketType },
        {
          where: { id: event.id },
          transaction,
        }
      );

      // Update previously reserved ticket IDs (optional, fallback logic)
      if (ticketIds.length > 0) {
        await TicketInstance.update(
          {
            paid: true,
            validationStatus: "valid",
            flwRef: reference,
          },
          {
            where: { id: ticketIds },
            transaction,
          }
        );
      }

      // Notify event owner
      const eventOwner = await UserInstance.findOne({
        where: { id: event.userId },
        transaction,
      });

      if (eventOwner) {
        await NotificationInstance.create(
          {
            id: uuidv4(),
            title: `Tickets purchased for "${event.title}"`,
            message: `Amount: ${payment.currency} ${(
              (payment.amount / 100) *
              0.98
            ).toFixed(2)}. Purchaser: ${name}.`,
            userId: event.userId,
            isRead: false,
          },
          { transaction }
        );
      }

      await sendTicketEmail(
        name,
        payment.customer.email,
        event,
        generatedTicketIds,
        qrCodes,
        attendees,
        payment.amount / 100,
        payment.currency,
        ticketPrice
      );

      await transaction.commit();

      return res.status(200).json({
        message: "Payment verified and tickets issued",
        ticketIds: generatedTicketIds,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err: any) {
    console.error("Verification error:", err.message);
    return res
      .status(500)
      .json({ error: "Internal error", details: err.message });
  }
};
