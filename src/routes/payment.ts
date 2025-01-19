import express from "express";
import { handlePaymentVerification, handleWebhook, purchaseTicket } from "../controllers/paymentCtrl";

const router = express.Router();

router.post("/create-payment-link/:eventId", purchaseTicket);
router.post("/webhook", handleWebhook);
router.post("/verify", handlePaymentVerification);

export default router;
