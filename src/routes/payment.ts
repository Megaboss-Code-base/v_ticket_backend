import express from 'express';
import { createPaymentLink, createPaymentLinkForSplitAccount, handleWebhook } from '../controllers/paymentCtrl';

const router = express.Router();

router.post('/create-payment-link', createPaymentLinkForSplitAccount);
router.post('/create-payment-link2', createPaymentLink);
router.post("/webhook", handleWebhook)

export default router;
