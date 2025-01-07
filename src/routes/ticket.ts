import express from "express";
import multer from 'multer';

import { auth } from "../middlewares/auth";
import {
  cancelTicket,
  getEventTickets,
  validateTicket,
} from "../controllers/ticketCtrl";
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.post(
  "/:eventId/validate-ticket",
  auth,
  upload.single("file"),
  validateTicket
);
router.delete("/:ticketId", cancelTicket);
router.get("/events/:eventId/tickets", auth, getEventTickets);

export default router;
