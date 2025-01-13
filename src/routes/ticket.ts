import express from "express";
import multer from 'multer';

import { auth } from "../middlewares/auth";
import {
  cancelTicket,
  deleteAllTickets,
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
router.delete("/", deleteAllTickets);
router.delete("/:ticketId", cancelTicket);
router.get("/validate-ticket", validateTicket);
router.get("/events/:eventId/tickets", auth, getEventTickets);

export default router;
