import express from "express";

import { auth } from "../middlewares/auth";
import {
  assignModerator,
  createEvent,
  deleteEvent,
  getAllEvents,
  getAllMyEvents,
  getEventById,
  getEventBySlug,
  getTrendingEvents,
  updateEvent,
} from "../controllers/eventCtrl";
import upload from "../utilities/multer";

const router = express.Router();

router.post("/create-event", auth, upload.array("gallery", 10), createEvent);
router.get("/all-events", getAllEvents);
router.get("/my-events", auth, getAllMyEvents);
router.get("/sorted-by-latest", getTrendingEvents);
router.post("/moderators", auth, assignModerator);
router.get("/slug/:slug", getEventBySlug);
router.get("/:id", getEventById);
router.patch("/:id", auth, upload.array("gallery", 10), updateEvent);
router.delete("/:id", auth, deleteEvent);

export default router;