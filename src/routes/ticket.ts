import express from "express";

import { auth } from "../middlewares/auth";
import {
  cancelTicket,
  getEventTickets,
  purchaseTicket,
} from "../controllers/ticketCtrl";

const router = express.Router();

router.post("/create-ticket/:eventId", purchaseTicket);
router.delete("/:ticketId", cancelTicket);
router.get("/events/:eventId/tickets", auth, getEventTickets);

export default router;
