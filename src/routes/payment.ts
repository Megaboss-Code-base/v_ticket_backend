import express from "express";
import { handlePaymentVerification, handleUnifiedWebhook, handleWebhook, purchaseTicket } from "../controllers/paymentCtrl";

const router = express.Router();

router.post("/create-payment-link/:eventId", purchaseTicket);
router.post("/webhook", handleUnifiedWebhook);
router.post("/verify", handlePaymentVerification);

export default router;
