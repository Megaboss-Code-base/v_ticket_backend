import express from "express";

import { auth } from "../middlewares/auth";
import { cancelTicket, getEventTickets, getUserTickets, purchaseTicket, validateTicket } from "../controllers/ticketCtrl";

const router = express.Router();

router.post("/create-ticket/:eventId", auth, purchaseTicket);
router.get("/my-tickets",auth, getUserTickets);
router.delete('/:ticketId', auth, cancelTicket);
router.patch("/:ticketId",auth, validateTicket);
router.get("/events/:eventId/tickets", auth, getEventTickets);

export default router;
