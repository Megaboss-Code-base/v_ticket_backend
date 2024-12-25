import { Request, Response } from "express";
import axios from "axios";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { v4 as uuidv4 } from "uuid";
import { FLUTTERWAVE_BASE_URL, FLUTTERWAVE_SECRET_KEY, FLUUERWAVE_HASH_SECRET, FRONTEND_URL } from "../config";
import TransactionInstance from "../models/transactionModel";

const generateReference = () => `unique-ref-${Date.now()}`;

export const createPaymentLink = async (req: Request, res: Response): Promise<any> => {
  if (!req.is("application/json")) {
    return res.status(400).json({ error: "Invalid Content-Type. Expected application/json." });
  }

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body cannot be empty" });
  }

  const tx_ref = generateReference();
  const { ticketId } = req.body;

  if (!ticketId) {
    return res.status(400).json({ error: "Missing required ticketId parameter" });
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
        email: ticket.email,
      },
      meta: {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        phone: ticket.phone,
        fullName: ticket.fullName,
      },
      amount: ticket.price,
      currency: ticket.currency,
      tx_ref,
      redirect_url: FRONTEND_URL,
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

export const handleWebhook = async (req: Request, res: Response): Promise<any> => {
  try {
    const secretHash = FLUUERWAVE_HASH_SECRET;
    const signature = req.headers["verif-hash"] as string;
console.log("signature",signature)
    if (!signature || signature !== secretHash) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    const payload = req.body;
    console.log("payload",payload)

    if (payload.status === "successful") {
      console.log("Payment successful:", payload);

      const { ticketId, eventId, phone, fullName, email } = payload.meta;
      const totalAmount = payload.amount / 100;
      const paymentReference = payload.flwRef;
      const currency = payload.currency;

      await TicketInstance.update(
        {
          validationStatus: "Valid",
          paid: true,
          phone,
          fullName,
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

      return res.status(200).send("Webhook received and transaction processed successfully");
    }

    return res.status(200).send("Webhook received successfully but payment was not successful");
  } catch (error: any) {
    console.error("Error handling webhook:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};





// export const handleWebhook = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const secretHash = FLUUERWAVE_HASH_SECRET;
//     const signature = req.headers["verif-hash"] as string;

//     if (!signature || signature !== secretHash) {
//       return res.status(401).json({ error: "Invalid signature" });
//     }

//     const payload = req.body;

//     if (payload.status === "successful") {
//       const { ticketId, eventId, phone, fullName } = payload.meta;

//       await TicketInstance.update(
//         {
//           validationStatus: "Valid",
//           paid: true,
//           phone,
//           fullName,
//           flwRef: payload.flwRef,
//         },
//         { where: { id: ticketId } }
//       );
//     }

//     res.status(200).send("Webhook received successfully");
//   } catch (error: any) {
//     console.error("Error handling webhook:", error.message);
//     res.status(500).json({ error: "Internal server error" });
//   }
// };
