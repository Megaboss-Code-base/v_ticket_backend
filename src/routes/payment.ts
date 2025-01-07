import express from "express";
import { handleWebhook, purchaseTicket } from "../controllers/paymentCtrl";

const router = express.Router();

router.post("/create-payment-link/:eventId", purchaseTicket);
router.post("/webhook", handleWebhook);

export default router;
