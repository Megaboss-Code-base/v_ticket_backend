import { Request, Response } from "express";
import { EventService } from "../services/event.service";

export class EventController {

    private eventService: EventService;

    constructor(eventService: EventService) {
        this.eventService = eventService
    }

    public createEvent = async (req:Request, res:Response): Promise<void> => {
        try {
            if(!req.body){
                res.status(400).json({
                    status: false,
                    message: 'All Fields are Required'
                })
                return
            }
            const event = await this.eventService.createEvent(req.body)
            if(!event){
                res.status(400).json({
                    status: false,
                    message: 'Something Went Wrong when trying to create'
                })
                return 
            }
            res.status(201).json({
                status: true,
                message: 'Event Created Successfully...'
            })
        } catch (error: any) {
            res.status(500).json({
                status: false,
                message: error.message,
                name: error.name
            })
        }
    }

    // get all events

    public getAllEvents = async (req: Request, res: Response): Promise<void> => {
        try {
            const events = await this.eventService.getEvents()
            if(!(events.length > 0)) {
                res.status(404).json({
                    status: false,
                    message: 'No Events is Available at the moment'
                })
                return
            }
            res.status(200).json({
                status: true,
                events: events
            })
        } catch (error: any) {
            res.status(500).json({
                status: false,
                message: 'Error: ' + error.message
            })
        }
    }

    public getEvent = async (req: Request, res: Response): Promise<void> => {
        try {
            const event = await this.eventService.getEventById(req.params.id)
            if(!event) {
                res.status(404).json({
                    status: false,
                    message: 'Event not found'
                });
                return 
            }
            res.status(200).json(event)
        } catch (error:any) {
            res.status(500).json({
                status: false,
                message: 'Error: ' + error.message
            })
        }
    }

    public updateEvent = async (req:Request, res:Response): Promise<void> => {
        try {
            const [affectedCount, affectedRows] = await this.eventService.updateEvent(req.params.id,req.body)

            if(affectedCount == 0){
                res.status(404).json({
                    status: false,
                    message: 'Event not found'
                })
                return 
            }
            res.status(200).json(affectedRows[0])
        } catch (error: any) {
            res.status(500).json({
                status: false,
                error: error.message
            })
        }
    }

    public deleteEvent = async(req:Request, res:Response):Promise<void> =>{
        try {
            const deleteCount = await this.eventService.deleteEvent(req.params.id)
            if(deleteCount === 0){
                res.status(404).json({
                    status: false,
                    message: 'Event Not Found'
                })
                return 
            }
            res.status(204).json({
                status: true,
                message: 'Event Deleted successfully'
            })
        } catch (error:any) {
            res.status(500).json({
                status: false,
                error: error.message
            })
        }
    }
}