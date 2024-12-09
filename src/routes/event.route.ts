import { Router } from "express";
import { EventService } from "../services/event.service";
import { EventController } from "../controllers/event.controller";

const eventRouter = Router()
const eventService = new EventService()
const eventController = new EventController(eventService)

eventRouter.route('/create-event').post(eventController.createEvent)
eventRouter.route('/events').get(eventController.getAllEvents)
eventRouter.route('/:id').get(eventController.getEvent).patch(eventController.updateEvent).delete(eventController.deleteEvent)
export default eventRouter