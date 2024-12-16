import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
import { db } from "../config";
import { UserInstance } from "./userModel";

export interface TicketType {
  name: string;
  quantity: string;
  sold: string;
  price: string;
}

export class EventInstance extends Model<
  InferAttributes<EventInstance>,
  InferCreationAttributes<EventInstance> 
> {
  declare id: string;
  declare title: string;
  declare description: string;
  declare image: string | null;
  declare date: Date;
  declare location: string;
  declare ticketType: TicketType[];
  declare userId: string;
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
          });
        },
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
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
    hooks: {
      beforeCreate: (event) => {
        event.ticketType = event.ticketType.map((ticket) => ({
          ...ticket,
          sold: "0",
        }));
      },
    },
  }
);

UserInstance.hasMany(EventInstance, { foreignKey: "userId", as: "events" });
EventInstance.belongsTo(UserInstance, { foreignKey: "userId", as: "user" });

export default EventInstance;
