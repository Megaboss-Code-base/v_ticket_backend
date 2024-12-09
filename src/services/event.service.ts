import { IEvent } from "../interface/event.interface";
import Event from "../models/event.model";
import { v4 as uuidv4 } from "uuid";
import { eventValidationSchema, validate } from "../utilities/validation";

export class EventService{

    public createEvent = async(eventData: IEvent): Promise<IEvent> =>{
        try {
            const { value, error } = validate(eventData, eventValidationSchema);

            if (error) {
            throw new Error(`Validation Error: ${error}`);
            }

            // Create the event in the database
            const event = await Event.create(value);
            return event;
        } catch (error:any) {
            throw new Error(`Error creating event: ${error.message}`);
        }
    }

    public getEvents = async (): Promise<IEvent[]> =>{
        try {
            const events = await Event.findAll()
            return events
        } catch (error:any) {
            throw new Error(`Error Fetching events: ${error.message}`);
        }
    }
    public getEventById = async(id:string): Promise<IEvent | null> =>{
        try {
            const eventId = await Event.findByPk(id)
            return eventId
        } catch (error:any) {
            throw new Error(`Error creating event: ${error.message}`);
        }
    }

    public updateEvent = async(eventId:string, event:IEvent): Promise<[number, Event[]]> =>{
        try {
            const [affectedCount, affectedRows] = await Event.update(event, {
                where: {id: eventId}, 
                returning: true
            });
            return [affectedCount, affectedRows]
        } catch (error:any) {
            throw new Error(`Error updating event: ${error.message}`)
        }
    }

    public deleteEvent = async(eventId:string): Promise<number> =>{
        try {
            const deleteEvent = await Event.destroy({
                where: {id: eventId}
            })

            console.log(deleteEvent);
            return deleteEvent
            
        } catch (error: any) {
            throw new Error(`Error Deleting Event: ${error.message}`)
        }
    }
}