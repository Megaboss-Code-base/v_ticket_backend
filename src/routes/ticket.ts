import express from "express";
import multer from 'multer';

import { auth } from "../middlewares/auth";
import {
  cancelTicket,
  getEventTickets,
  purchaseTicket,
  validateTicket,
} from "../controllers/ticketCtrl";
const upload = multer({ dest: 'uploads/' });  // Change the 'uploads/' directory as needed

const router = express.Router();

router.post("/create-ticket/:eventId", purchaseTicket);
router.post(
  "/:eventId/validate-ticket",
  auth,
  upload.single("file"),
  validateTicket
);
router.delete("/:ticketId", cancelTicket);
router.get("/events/:eventId/tickets", auth, getEventTickets);

export default router;
