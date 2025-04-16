import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { db } from "../config";
import { UserInstance } from "./userModel";

export interface TicketType {
  name: string;
  price: string;
  quantity: string;
  sold: string;
  details?: string;
}

export interface SocialMediaLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  [key: string]: string | undefined;
}
export interface VirtualDetails {
  platform?: string;
  meetingUrl?: string;
  meetingId?: string;
  passcode?: string;
  requiresPassword?: boolean;
  virtualPassword?: string;
  enableWaitingRoom?: boolean;
  lockRoom?: boolean;
  [key: string]: string | boolean | undefined;
}


export class EventInstance extends Model<
  InferAttributes<EventInstance>,
  InferCreationAttributes<EventInstance>
> {
  declare id: string;
  declare title: string;
  declare slug: string;
  declare description: string;
  declare image: string | null;
  declare date: Date;
  declare location: string;
  declare ticketType: TicketType[];
  declare time: string;
  declare venue: string;
  declare gallery: string[] | null;
  declare socialMediaLinks: SocialMediaLinks | null;
  declare hostName: string;
  declare userId: string;
  declare isVirtual: boolean | null;
  declare virtualEventDetails: VirtualDetails | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

EventInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gallery: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    socialMediaLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    hostName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ticketType: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        isValidArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error("ticketType must be an array");
          }
          value.forEach((ticket) => {
            if (
              typeof ticket.name !== "string" ||
              typeof ticket.quantity !== "string" ||
              typeof ticket.sold !== "string" ||
              typeof ticket.price !== "string"
            ) {
              throw new Error(
                "Each ticketType entry must include valid name, quantity, sold, and price as strings"
              );
            }
            if (ticket.details && typeof ticket.details !== "string") {
              throw new Error(
                "ticketType details must be a string if provided"
              );
            }
          });
        },
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    isVirtual: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    virtualEventDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: db,
    tableName: "events",
  }
);

UserInstance.hasMany(EventInstance, { foreignKey: "userId", as: "events" });
EventInstance.belongsTo(UserInstance, { foreignKey: "userId", as: "user" });

export default EventInstance;
