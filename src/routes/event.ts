import express from "express";

import { auth } from "../middlewares/auth";
import {
  createEvent,
  deleteEvent,
  getAllEvents,
  getAllMyEvents,
  getEventById,
  getEventsSortedBySoldQuantityRatio,
  updateEvent,
} from "../controllers/eventCtrl";
import upload from "../utilities/multer";

const router = express.Router();

router.post("/create-event", auth, upload.single("file"), createEvent);
router.get("/all-events", getAllEvents);
router.get("/my-events", auth, getAllMyEvents);
router.get("/:id", auth, getEventById);
router.patch("/:id", auth,upload.single("file"), updateEvent);
router.delete("/:id", auth, deleteEvent);
router.get(
  "/sorted-by-sold-quantity-ratio",
  getEventsSortedBySoldQuantityRatio
);

export default router;
