import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { db } from "../config";
import EventInstance from "./eventModel";

export class TicketInstance extends Model<
  InferAttributes<TicketInstance>,
  InferCreationAttributes<TicketInstance>
> {
  declare id: string;
  declare email: string;
  declare phone: string;
  declare fullName: string;
  declare eventId: string;
  declare ticketType: string;
  declare price: number;
  declare purchaseDate: Date;
  declare qrCode: string;
  declare paid: boolean;
  declare currency: string;
  declare flwRef: string | null;
  declare attendees:
    | { name: string; email: string }
    | { name: string; email: string }[]
    | null;
  declare validationStatus: "valid" | "invalid" | "expired" | "used";
  declare isScanned: boolean;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TicketInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ticketType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    flwRef: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    attendees: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidAttendees(value: any) {
          if (value !== null) {
            if (Array.isArray(value)) {
              value.forEach((attendee: any) => {
                if (
                  typeof attendee.name !== "string" ||
                  typeof attendee.email !== "string"
                ) {
                  throw new Error(
                    "Each attendee in the array must have a name and email as strings"
                  );
                }
              });
            } else if (
              typeof value.name !== "string" ||
              typeof value.email !== "string"
            ) {
              throw new Error(
                "Single attendee must have a name and email as strings"
              );
            }
          }
        },
      },
    },
    validationStatus: {
      type: DataTypes.ENUM("valid", "invalid", "used", "expired"), // Changed to ENUM
      allowNull: false,
      defaultValue: "invalid",
    },
    isScanned: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: "tickets",
  }
);

EventInstance.hasMany(TicketInstance, { foreignKey: "eventId", as: "tickets" });
TicketInstance.belongsTo(EventInstance, { foreignKey: "eventId", as: "event" });

export default TicketInstance;
