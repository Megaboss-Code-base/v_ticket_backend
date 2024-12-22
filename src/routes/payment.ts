import express from 'express';
import { createPaymentLink, handleWebhook } from '../controllers/paymentCtrl';
import { auth } from '../middlewares/auth';

const router = express.Router();

// Route for creating a payment link
router.post('/create-payment-link',auth, createPaymentLink);
router.post("/webhook", handleWebhook)
// Route for handling the payment callback
// router.get('/payment-callback',auth, handlePaymentCallback);

export default router;
