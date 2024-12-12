import express from "express";

import { auth } from "../middlewares/auth";
import { createEvent, deleteEvent, getAllEvents, getAllMyEvents, getEventById, updateEvent } from "../controllers/eventCtrl";

const router = express.Router();

router.post("/create-event", auth, createEvent);
router.get("/all-events", getAllEvents);
router.get('/my-events', auth, getAllMyEvents);
router.get('/:id', auth, getEventById);
router.patch('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);

export default router;
