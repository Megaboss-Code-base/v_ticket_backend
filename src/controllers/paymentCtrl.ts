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
  generateRandomAlphaNumeric,
  generateRandomNumber,
  generateTicketSignature,
  PAYSTACK_BASE_URL,
  PAYSTACK_SECRET_KEY,
  STRIPE_SECRET_KEY,
  validatePaystackWebhook,
} from "../config";
import TransactionInstance from "../models/transactionModel";
import EventInstance from "../models/eventModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import QRCode from "qrcode";
import { NotificationInstance } from "../models/notificationModel";
import sendEmail from "../utilities/sendMail";
const stripe = require("stripe")(STRIPE_SECRET_KEY);
import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_URL } from "../config";

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

    // Attempt to create a Flutterwave payment link
    try {
      const flutterwaveResponse = await axios.post(
        `${FLUTTERWAVE_BASE_URL}/payments`,
        {
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
          redirect_url: `${FRONTEND_URL}/success?ticketId=${ticketId}`,
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
        },
        {
          headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (
        flutterwaveResponse.data &&
        flutterwaveResponse.data.data &&
        flutterwaveResponse.data.data.link
      ) {
        return res.status(200).json({
          link: flutterwaveResponse.data.data.link,
          ticketId,
        });
      } else {
        throw new Error("Error creating Flutterwave payment link");
      }
    } catch (flutterwaveError: any) {
      console.error("Flutterwave error:", flutterwaveError.message);

      // Fallback to Paystack
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
          error:
            "Failed to create payment link with both Flutterwave and Paystack",
        });
      }
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
    // Validate Flutterwave webhook
    const flutterwaveSignature =
      req.headers["verif-hash"] || req.headers["Verif-Hash"];

    if (
      flutterwaveSignature &&
      flutterwaveSignature === FLUTTERWAVE_HASH_SECRET
    ) {
      const payload = req.body;
      if (payload.data.status === "successful") {
        const { ticketId } = payload.meta_data;
        const { email, name } = payload.data.customer;
        const totalAmount = payload.data.amount;
        const paymentReference = payload.data.flw_ref;
        const currency = payload.data.currency;

        await TransactionInstance.create({
          id: payload.data.id,
          email,
          fullName: name,
          ticketId,
          paymentStatus: "successful",
          totalAmount,
          paymentReference,
          currency,
        });

        return res
          .status(200)
          .json({ message: "Flutterwave webhook processed successfully" });
      } else {
        return res
          .status(400)
          .json({ error: "Flutterwave payment was not successful" });
      }
    }

    // Validate Paystack webhook
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
        const totalAmount = amount / 100; // Convert back to base currency

        const customFields = metadata?.custom_fields || [];
        const ticketId = getCustomFieldValue(customFields, "ticket_id");
        const fullName = getCustomFieldValue(customFields, "full_name");

        await TransactionInstance.create({
          id,
          email,
          fullName,
          ticketId,
          paymentStatus: "successful",
          totalAmount,
          paymentReference: reference,
          currency,
        });

        return res
          .status(200)
          .json({ message: "Paystack webhook processed successfully" });
      } else {
        return res
          .status(400)
          .json({ error: "Invalid Paystack webhook event" });
      }
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
  const { transactionId, reference } = req.body;

  try {
    let paymentDetails;
    let totalAmount;
    let ticketId;
    let quantity;
    let email;
    let name;

    if (transactionId) {
      const transactionIdAsNumber = Number(transactionId);
      if (isNaN(transactionIdAsNumber)) {
        return res.status(400).json({ error: "Invalid transaction ID format" });
      }

      const flutterwaveResponse = await flw.Transaction.verify({
        id: transactionIdAsNumber,
      });

      paymentDetails = flutterwaveResponse.data;

      if (paymentDetails.status !== "successful") {
        return res.status(400).json({ error: "Payment verification failed" });
      }

      totalAmount = paymentDetails.amount;
      ticketId = paymentDetails.meta.ticketId;
      quantity = paymentDetails.meta.quantity;
      email = paymentDetails.customer.email;
      name = paymentDetails.customer.name;
    } else if (reference) {
      // Check if the transaction is from Paystack
      const paystackResponse = await axios.get(
        `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      paymentDetails = paystackResponse.data.data;
      if (paymentDetails.status !== "success") {
        return res.status(400).json({ error: "Payment verification failed" });
      }
      totalAmount = paymentDetails.amount / 100;
      email = paymentDetails.customer.email;

      const customFields = paymentDetails.metadata?.custom_fields || [];
      ticketId = getCustomFieldValue(customFields, "ticket_id");
      name = getCustomFieldValue(customFields, "full_name");
      quantity = parseInt(
        getCustomFieldValue(customFields, "quantity") || "1",
        10
      );
    } else {
      return res.status(400).json({ error: "Missing transaction identifier" });
    }

    const paymentReference = paymentDetails.reference || paymentDetails.flw_ref;
    const currency = paymentDetails.currency;
    const id = paymentDetails.id;

    const existingTransaction = await TransactionInstance.findOne({
      where: { paymentReference, paymentStatus: "successful" },
    });

    const existingTicket = await TicketInstance.findOne({
      where: { id: ticketId, paid: true, validationStatus: "valid" },
    });

    if (existingTransaction && existingTicket) {
      return res.status(400).json({
        error: "Payment already verified and cannot be processed again.",
      });
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
          sold: (currentSold + parseInt(quantity, 10)).toString(),
          quantity: (currentQuantity - parseInt(quantity, 10)).toString(),
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
        const earnings = (totalAmount * 0.8847).toFixed(2);
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

      const appOwnerEarnings = parseFloat((totalAmount * 0.0983).toFixed(2));

      await UserInstance.increment(
        { totalEarnings: appOwnerEarnings },
        { where: { id: ACCOUNT_OWNER_ID }, transaction }
      );

      const mailSubject = `Your Ticket for "${event.title}"`;
      const mailMessage = `
        <p>Dear ${name},</p>
        
        <p>Thank you for purchasing a ticket for the event "${event.title}".</p>
        <p>Here are your ticket details:</p>
        
        <ul>
          <li><strong>Event:</strong> ${event.title}</li>
          <li><strong>Ticket Type:</strong> ${ticket.ticketType}</li>
          <li><strong>Price:</strong> ${currency} ${totalAmount.toFixed(2)}</li>
          <li><strong>Quantity:</strong> ${quantity}</li>
          <li><strong>Date:</strong> ${new Date(
            event.date
          ).toLocaleDateString()}</li>
        </ul>
                        
        <p>Please find your ticket QR code below. You can also download it using the link provided:</p>

          <img src="${
            ticket.qrCode
          }" alt="Ticket QR Code" style="max-width: 200px;">

          <p><a href="${
            ticket.qrCode
          }" download="ticket_qrcode.png">Download QR Code</a></p>
          <p>Best regards,<br>The Event Team</p>
      `;

      try {
        await sendEmail({
          email,
          subject: mailSubject,
          message: mailMessage,
        });
      } catch (error: any) {
        await transaction.rollback();
        console.error("Email sending failed:", error.message);
        return res.status(500).json({ error: "Failed to send email" });
      }

      await transaction.commit();

      return res
        .status(200)
        .json({ message: "Payment verified and processed" });
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error("Error during payment verification:", error.message);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};

export const stripePayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { ticketType, currency, email, phone, fullName, attendees, quantity } =
    req.body;
  const { eventId } = req.params;

  if (!email || !phone || !fullName || !quantity || quantity < 1) {
    return res
      .status(400)
      .json({ error: "Provide all required fields and a valid quantity" });
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
    const ticketId = uuidv4();
    const signature = generateTicketSignature(ticketId);
    const qrCodeData = `${FRONTEND_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    if (ticketPrice === 0) {
      const allAttendees =
        attendees && attendees.length > 0
          ? attendees
          : [{ name: fullName, email }];

      const ticket = await TicketInstance.create({
        id: ticketId,
        email,
        phone,
        fullName,
        eventId: event.id,
        ticketType,
        price: 0,
        purchaseDate: new Date(),
        qrCode,
        paid: true,
        currency,
        attendees: allAttendees,
        validationStatus: "valid",
        isScanned: false,
      });

      ticketInfo.quantity = (Number(ticketInfo.quantity) - quantity).toString();
      ticketInfo.sold = (Number(ticketInfo.sold || 0) + quantity).toString();

      await EventInstance.update(
        { ticketType: event.ticketType },
        { where: { id: event.id } }
      );

      return res.status(200).json({
        message: "Ticket successfully created for free event",
        ticketId: ticket.id,
        redirect: FRONTEND_URL,
        ticket,
      });
    }

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

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `${event.title} - ${ticketType} Ticket`,
                description: `Ticket for ${event.title}`,
              },
              unit_amount: Math.round(ticketPrice * 100),
            },
            quantity,
          },
        ],
        customer_email: email,
        metadata: {
          eventId,
          ticketId,
          ticketType,
          quantity: quantity.toString(),
          fullName,
          phone,
          attendees: JSON.stringify(attendees || []),
        },
        mode: "payment",
        success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${FRONTEND_URL}/failed`,
      });

      return res.status(200).json({
        message: "Redirect to Stripe Checkout",
        checkoutUrl: session.url,
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error.message,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to create ticket",
      details: error.message,
    });
  }
};

export const stripePaymentIntent = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { ticketType, currency, email, phone, fullName, attendees, quantity } =
    req.body;
  const { eventId } = req.params;

  if (!email || !phone || !fullName || !quantity || quantity < 1) {
    return res
      .status(400)
      .json({ error: "Provide all required fields and a valid quantity" });
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
    const ticketId = uuidv4();
    const signature = generateTicketSignature(ticketId);
    const qrCodeData = `${FRONTEND_URL}/validate-ticket?ticketId=${ticketId}&signature=${signature}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    if (ticketPrice === 0) {
      const allAttendees =
        attendees && attendees.length > 0
          ? attendees
          : [{ name: fullName, email }];

      const ticket = await TicketInstance.create({
        id: ticketId,
        email,
        phone,
        fullName,
        eventId: event.id,
        ticketType,
        price: 0,
        purchaseDate: new Date(),
        qrCode,
        paid: true,
        currency,
        attendees: allAttendees,
        validationStatus: "valid",
        isScanned: false,
      });

      ticketInfo.quantity = (Number(ticketInfo.quantity) - quantity).toString();
      ticketInfo.sold = (Number(ticketInfo.sold || 0) + quantity).toString();

      await EventInstance.update(
        { ticketType: event.ticketType },
        { where: { id: event.id } }
      );

      return res.status(200).json({
        message: "Ticket successfully created for free event",
        ticketId: ticket.id,
        redirect: FRONTEND_URL,
        ticket,
      });
    }

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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalPrice * 100,
      currency,
      receipt_email: email,
      metadata: { eventId, ticketType, quantity },
    });

    res.status(201).json({
      message: "Payment initiated",
      data: paymentIntent.client_secret,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to create ticket",
      details: error.message,
    });
  }
};

export const confirmStripePayment = async (
  req: Request,
  res: Response
): Promise<any> => {
  const sessionId = req.query.session_id;

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({ error: "Invalid session ID" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      !session.payment_status ||
      !session.id ||
      !session.amount_total ||
      !session.metadata
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields in Stripe session" });
    }

    if (session.payment_status !== "paid") {
      return res.status(400).json({ payment_status: "unpaid" });
    }

    const paymentReference = session.id;
    const totalAmount = session.amount_total / 100;
    const ticketId = session.metadata.ticketId;
    const quantity = parseInt(session.metadata.quantity, 10);
    const email = session.customer_email;
    const name = session.metadata.fullName;
    const currency = session.currency;

    if (!ticketId || isNaN(quantity) || quantity <= 0 || !name || !email) {
      return res.status(400).json({ error: "Invalid metadata fields" });
    }

    const id = generateRandomNumber(111111111, 100000000000);
    const transaction = await db.transaction();

    try {
      const existingTransaction = await TransactionInstance.findOne({
        where: { paymentReference, paymentStatus: "successful" },
      });

      if (existingTransaction) {
        return res.status(400).json({
          error: "Payment already verified and cannot be processed again.",
        });
      }

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

      if (ticketTypeIndex < 0) {
        throw new Error("Ticket type not found in the event");
      }

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

      const eventOwner = await UserInstance.findOne({
        where: { id: event.userId },
        transaction,
      });

      if (eventOwner) {
        const earnings = (totalAmount * 0.8847).toFixed(2);
        await NotificationInstance.create(
          {
            id: uuidv4(),
            title: `Ticket purchased for your event "${event.title}"`,
            message: `A ticket for your event titled "${event.title}" has been purchased. Amount paid: ${currency} ${earnings}. Purchaser: ${name}.`,
            userId: event.userId,
            isRead: false,
          },
          { transaction }
        );
      }

      const appOwnerEarnings = parseFloat((totalAmount * 0.0983).toFixed(2));
      await UserInstance.increment(
        { totalEarnings: appOwnerEarnings },
        { where: { id: ACCOUNT_OWNER_ID }, transaction }
      );

      // const qrCodeBase64 = ticket.qrCode.split(",")[1];
      // const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64");
      // const qrCodeFilename = `ticket-${ticket.id}-qrcode.png`;

      // const qrCodePath = path.join(__dirname, "..", "temp", qrCodeFilename);
      // fs.writeFileSync(qrCodePath, qrCodeBuffer);

      // const mailSubject = `Your Ticket for "${event.title}"`;
      // const mailMessage = `
      //   Dear ${name},

      //   Thank you for purchasing a ticket for the event "${event.title}".
      //   Here are your ticket details:

      //   - Event: ${event.title}
      //   - Ticket Type: ${ticket.ticketType}
      //   - Price: ${currency} ${totalAmount.toFixed(2)}
      //   - Date: ${new Date(event.date).toLocaleDateString()}

      //   Please find your ticket QR code attached below.

      //   Best regards,
      //   The Event Team
      // `;

      // try {
      //   await sendEmail({
      //     email,
      //     subject: mailSubject,
      //     message: mailMessage,
      //     attachments: [
      //       {
      //         filename: `ticket-${ticket.id}-qrcode.png`,
      //         content: "",
      //         contentType: "image/png",
      //         encoding: "base64",
      //       },
      //     ],
      //   });
      // } catch (error:any) {
      //   await transaction.rollback();
      //   console.error("Email sending failed:", error.message);
      //   return res.status(500).json({ error: "Failed to send email" });
      // }

      // fs.unlinkSync(qrCodePath);

      const qrCodeBase64 = ticket.qrCode.split(",")[1]; // Assuming ticket.qrCode is a data URI
      const qrCodeBuffer = Buffer.from(qrCodeBase64, "base64"); // Convert base64 to Buffer
      const qrCodeFilename = `ticket-${ticket.id}-qrcode.png`;

      // Define the email subject and HTML message
      const mailSubject = `Your Ticket for "${event.title}"`;

      const mailMessage = `
  <p>Dear ${name},</p>
  
  <p>Thank you for purchasing a ticket for the event "${event.title}".</p>
  <p>Here are your ticket details:</p>
  
  <ul>
    <li><strong>Event:</strong> ${event.title}</li>
    <li><strong>Ticket Type:</strong> ${ticket.ticketType}</li>
    <li><strong>Price:</strong> ${currency} ${totalAmount.toFixed(2)}</li>
    <li><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</li>
  </ul>
  
  <p>Please find your ticket QR code attached below.</p>
  
  <p>Best regards,<br>The Event Team</p>
`;

      try {
        // Call the sendEmail function with the HTML message
        await sendEmail({
          email,
          subject: mailSubject,
          message: mailMessage, // Pass the HTML message
          isHtml: true, // Indicate that the message is in HTML format
          // attachments: [
          //   {
          //     filename: qrCodeFilename,
          //     content: qrCodeBuffer,
          //     contentType: "image/png",
          //     encoding: "base64",
          //   },
          // ],
        });
      } catch (error: any) {
        await transaction.rollback(); // Rollback the database transaction if email fails
        console.error("Email sending failed:", error.message);
        return res.status(500).json({ error: "Failed to send email" });
      }

      await transaction.commit();
      return res
        .status(200)
        .json({ message: "Payment verified and processed" });
    } catch (error: any) {
      await transaction.rollback();
      console.error("Transaction error:", error.message);
      return res.status(500).json({ error: "Transaction failed" });
    }
  } catch (error) {
    console.error("Error fetching session:", error);
    return res.status(500).json({ error: "Could not confirm payment" });
  }
};
