import { Request, Response } from "express";
import axios from "axios";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import { JwtPayload } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { FLUTTERWAVE_SECRET_KEY,FLUUERWAVE_HASH_SECRET } from "../config";

const generateReference = () => `unique-ref-${Date.now()}`;

export const createPaymentLink = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  const userId = req.user;
  const tx_ref = generateReference();
  const { ticketId } = req.body;

  if (!userId) {
    return res.status(404).json({ message: "Please log in to create an event" });
  }

  // Find the user
  const user = await UserInstance.findOne({ where: { id: userId } })as unknown as UserAttribute;
  if (!user) {
    return res.status(404).json({ error: "User not found or unauthorized" });
  }

  // Find the ticket
  const ticket = await TicketInstance.findOne({ where: { id: ticketId, userId } }) as unknown as TicketAttribute;
  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found or unauthorized" });
  }
  const paymentData = {
    customer: {
      email: user.email,
    },
    // email: user.email,
    amount: ticket.price,
    currency: ticket.currency,
    tx_ref,
    order_id: ticket.eventId,
    redirect_url: "https://virtual-ticket-two.vercel.app/dashboard",
  };
  try {
    // Send request to Flutterwave API using axios
    const response = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.status(200).json({ link: response.data.data.link });

    // Check for successful response and return the payment link
    // if (response.data.status === "success") {
    //   return res.status(200).json({ link: response.data.link });
    // } else {
    //   return res.status(400).json({ message: "Error creating payment link" });
    // }
  } catch (error: any) {
    console.error("Error creating payment link:", error.message);
    return res.status(500).json({ message: "Error creating payment link" });
  }
};


export const handleWebhook = async (req: Request, res: Response):Promise<any> => {
  try {
    const secretHash = FLUUERWAVE_HASH_SECRET;
    console.log("Secret Hash:", secretHash);

    // Extracting Flutterwave's signature from headers
    const signature = req.headers["verif-hash"] as string;
    console.log("Signature from header:", signature);

    if (!signature || signature !== secretHash) {
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    // Accessing the payload
    const payload = req.body;
    console.log("Webhook payload:", payload);

    if (payload.status === "successful") {
      // Handle successful payment
      console.log("Payment successful:", payload);

      // Example logic: update ticket status or process the payment
      // const ticket = await TicketInstance.findOne({ where: { id: payload.ticketId } });
      // if (ticket) {
      //   await ticket.update({ status: "paid" });
      // }
    }

    // Respond to Flutterwave
    res.status(200).send("Webhook received successfully");
  } catch (error: any) {
    console.error("Error handling webhook:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Webhook payload: {
  // id: 8285697,
  // txRef: 'unique-ref-1734879018279',
  // flwRef: 'FLW-MOCK-0fcd05e155096ed3d677076e379fc2e1',
  // orderRef: 'URF_1734879062755_2544235',
  // paymentPlan: null,
  // paymentPage: null,
  // createdAt: '2024-12-22T14:51:03.000Z',
  // amount: 100,
  // charged_amount: 100,
  // status: 'successful',
  // IP: '54.75.161.64',
  // currency: 'NGN',
  // appfee: 1.4,
  // merchantfee: 0,
  // merchantbearsfee: 1,
  // charge_type: 'normal',
  // customer: {
  //   id: 2562211,
  //   phone: null,
  //   fullName: 'Anonymous customer',
  //   customertoken: null,
  //   email: 'terry966@gmail.com',
  //   createdAt: '2024-12-22T14:51:02.000Z',
  //   updatedAt: '2024-12-22T14:51:02.000Z',
  //   deletedAt: null,
  //   AccountId: 2567719
  // },