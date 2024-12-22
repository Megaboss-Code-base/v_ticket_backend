import axios from "axios";
import { ACCOUNT_ID, db, FLUTTERWAVE_BASE_URL, FLUTTERWAVE_SECRET_KEY } from "../config";
import { TicketAttribute, TicketInstance } from "../models/ticketModel";
import { UserAttribute, UserInstance } from "../models/userModel";
import TransactionInstance from "../models/transactionModel";
import { Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

export const processPayment = async (req: JwtPayload, res: Response): Promise<void> => {
  const { ticketId } = req.body;

  const eventOwnerId = "RS_BA09EE5FB7A7B983F4D91BDED4780027"
  const userId = req.user; 

  if (!userId) {
    res.status(401).json({ message: "Unauthorized. Please log in." });
    return;
  }

  const transaction = await db.transaction();

  try {
    const ticket = await TicketInstance.findOne({ where: { id: ticketId } }) as unknown as TicketAttribute;
    if (!ticket) throw new Error("Ticket not found");

    const user = await UserInstance.findOne({ where: { id: userId } }) as unknown as UserAttribute;
    if (!user) throw new Error("User not found");

    const totalAmount = ticket.price;
    const yourShare = (10 / 100) * totalAmount;
    const eventOwnerShare = totalAmount - yourShare;

    // Payment Payload
    const paymentPayload = {
      tx_ref: `TX-${Date.now()}`,
      amount: totalAmount,
      currency: ticket.currency,
      redirect_url: "https://v-ticket-backend.onrender.com/api/tickets/payment-success",
      customer: {
        email: user.email,
        phonenumber: user.phone,
        name: user.fullName,
      },
      split: {
        type: "percentage",
        subaccounts: [
          {
            id: ACCOUNT_ID,
            transaction_split_ratio: "10",
          },
          {
            id: eventOwnerId,
            transaction_split_ratio: "90",
          },
        ],
      },
    };

    // Initiate Payment
    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      paymentPayload,
      {
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status !== "success") {
      throw new Error("Payment initiation failed");
    }

    const paymentData = response.data.data;

    await TransactionInstance.create(
      {
        id: paymentData.tx_ref, // Ensure tx_ref is used as the ID for the transaction
        userId,
        ticketId,
        totalAmount,
        paymentStatus: paymentData.status === "success" ? "Completed" : "Failed",
        paymentReference: paymentData.flw_ref,  // This should be extracted from the paymentData
        currency: paymentData.currency,  // This should also come from the paymentData
      },
      { transaction }
    );

    await TicketInstance.update(
      { paid: true, validationStatus: "Valid" },
      { where: { id: ticketId }, transaction }
    );

    await transaction.commit();
    res.status(200).json({
      message: "Payment processed successfully",
      paymentData,
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error("Error processing payment:", error.message);
    res.status(500).json({ message: "Payment processing failed", error: error.message });
  }
};


/*
eventOwnerId
YOUR_SUB_ACCOUNT_ID
*/
