import express from "express";

import { auth } from "../middlewares/auth";
import {
  cancelTicket,
  getEventTickets,
  getUserTickets,
  handlePaymentRedirect,
  purchaseTicket,
} from "../controllers/ticketCtrl";
import { processPayment } from "../utilities/flutterwave";

const router = express.Router();

router.post("/create-ticket/:eventId", auth, purchaseTicket);
router.get("/my-tickets", auth, getUserTickets);
router.delete("/:ticketId", auth, cancelTicket);
router.get("/events/:eventId/tickets", auth, getEventTickets);
router.get("/payment-success", handlePaymentRedirect);
router.post("/payment",auth, processPayment);

export default router;
