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

const generateReference = () => `unique-ref-${Date.now()}`;

export const createPaymentLink = async (
  req: Request,
  res: Response
): Promise<any> => {
  if (!req.is("application/json")) {
    return res
      .status(400)
      .json({ error: "Invalid Content-Type. Expected application/json." });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body cannot be empty" });
  }

  const tx_ref = generateReference();
  const { ticketId } = req.body;

  if (!ticketId) {
    return res
      .status(400)
      .json({ error: "Missing required ticketId parameter" });
  }

  try {
    const ticket = (await TicketInstance.findOne({
      where: { id: ticketId },
    })) as unknown as TicketAttribute;

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const paymentData = {
      customer: {
        name: ticket.fullName,
        email: ticket.email,
      },
      meta: {
        ticketId: ticket.id,
        phone: ticket.phone,
        fullName: ticket.fullName,
      },
      amount: ticket.price,
      currency: ticket.currency,
      tx_ref,
    };

    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
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
      return res.status(400).json({ message: "Error creating payment link" });
    }
  } catch (error: any) {
    console.error("Error creating payment link:", error.message);
    return res.status(500).json({ message: "Error creating payment link" });
  }
};

export const createPaymentLinkForSplitAccount = async (
  req: Request,
  res: Response
): Promise<any> => {
  if (!req.is("application/json")) {
    return res
      .status(400)
      .json({ error: "Invalid Content-Type. Expected application/json." });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body cannot be empty" });
  }

  const tx_ref = generateReference();
  const { ticketId } = req.body;

  if (!ticketId) {
    return res
      .status(400)
      .json({ error: "Missing required ticketId parameter" });
  }

  try {
    const ticket = (await TicketInstance.findOne({
      where: { id: ticketId },
      include: [{ model: EventInstance, as: "event", attributes: ["userId"] }],
    })) as unknown as TicketAttribute & { event: EventInstance };

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const eventOwner = (await UserInstance.findOne({
      where: {
        id: ticket.event.userId,
      },
    })) as unknown as UserAttribute;

    if (!eventOwner) {
      return res.status(404).json({ error: "Event owner not found" });
    }

    const paymentData = {
      customer: {
        name: ticket.fullName,
        email: ticket.email,
      },
      meta: {
        ticketId: ticket.id,
        phone: ticket.phone,
        fullName: ticket.fullName,
      },
      amount: ticket.price,
      currency: ticket.currency,
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
    if (error.response) {
      console.error("Flutterwave Response Error:", error.response.data);
      return res.status(400).json({
        message: "Error creating payment link",
        error: error.response.data,
      });
    } else {
      return res
        .status(500)
        .json({ message: "Error creating payment link", error: error.message });
    }
  }
};

export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {

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

      await TicketInstance.update(
        {
          validationStatus: "Valid",
          paid: true,
          flwRef: paymentReference,
        },
        { where: { id: ticketId } }
      );

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
