import express from "express";
import {
  confirmStripePayment,
  handlePaymentVerification,
  handleUnifiedWebhook,
  purchaseTicket,
  stripePayment,
} from "../controllers/paymentCtrl";

const router = express.Router();

router.post("/create-payment-link/:eventId", purchaseTicket);
router.post("/create-stripe-link/:eventId", stripePayment);
router.get("/confirm-stripe-payment", confirmStripePayment);
router.post("/webhook", handleUnifiedWebhook);
router.post("/verify", handlePaymentVerification);

export default router;
