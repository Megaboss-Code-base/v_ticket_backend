
export interface IEvent{
    id: string;
    title: string;
    description: string;
    date: Date;
    location: string;
    price: number;
    ticketType: 'BASIC' | 'VIP';
    createdAt?: Date;
    updatedAt?: Date;
}


// Interface for Event creation, making certain fields optional
export interface IEventCreate extends Omit<IEvent, 'createdAt' | 'updatedAt'> {}
export interface IEventUpdate extends Partial<IEvent> {}
