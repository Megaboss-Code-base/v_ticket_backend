import Flutterwave from "flutterwave-node-v3";
import { FLWPUBK, FLWSECK } from "../config";

const flw = new Flutterwave(FLWPUBK, FLWSECK);

export const initiatePayment = async (payload: {
  tx_ref: string;
  amount: number;
  currency: string;
  email: string;
  redirect_url: string;
}) => {
  try {
    // const response = await flw.Charge.card({
    //   tx_ref: payload.tx_ref,
    //   amount: payload.amount,
    //   currency: payload.currency,
    //   redirect_url: payload.redirect_url,
    //   customer: {
    //     email: payload.email,
    //   },
    //   payment_options: "card", // Optional: specify payment options
    // });

    // if (response.status === "success") {
    //   return response.meta.authorization.redirect; // Payment link
    // } else {
    //   throw new Error(response.message || "Failed to initiate payment.");
    // }
  } catch (error) {
    console.error("Payment initiation error:", error);
    throw new Error("Failed to initiate payment.");
  }
};
export const verifyPayment = async (transactionId: string) => {
  try {
    // const response = await flw.Transaction.verify({ id: transactionId });

    // if (response.status === "success") {
    //   return response.data;
    // } else {
    //   throw new Error("Payment verification failed.");
    // }
  } catch (error) {
    console.error("Payment verification error:", error);
    throw new Error("Failed to verify payment.");
  }
};