// import { DataTypes, Model } from "sequelize";
// import { db } from "../config";
// import { EventInstance } from "./eventModel";

// export interface TicketAttribute {
//   id: string;
//   eventId: string;
//   email: string;
//   phone: string;
//   fullName: string;
//   ticketType: string;
//   price: number;
//   purchaseDate: Date;
//   qrCode: string;
//   validationStatus: "Valid" | "Used" | "Expired" | "Invalid";
//   seatNumber?: string;
//   paid: boolean;
//   currency: string;
//   flwRef?: string;
// }

// export class TicketInstance extends Model<TicketAttribute> {}

// TicketInstance.init(
//   {
//     id: {
//       type: DataTypes.UUID,
//       primaryKey: true,
//       allowNull: false,
//       defaultValue: DataTypes.UUIDV4,
//     },
//     eventId: {
//       type: DataTypes.UUID,
//       allowNull: false,
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     phone: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     fullName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     ticketType: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     price: {
//       type: DataTypes.FLOAT,
//       allowNull: false,
//     },
//     purchaseDate: {
//       type: DataTypes.DATE,
//       allowNull: false,
//       defaultValue: DataTypes.NOW,
//     },
//     paid: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false,
//     },
//     qrCode: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//     },
//     validationStatus: {
//       type: DataTypes.ENUM("Valid", "Used", "Expired", "Invalid"),
//       allowNull: false,
//       defaultValue: "Invalid",
//     },
//     seatNumber: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//     currency: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//     flwRef: {
//       type: DataTypes.STRING,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize: db,
//     tableName: "tickets",
//   }
// );

// EventInstance.hasMany(TicketInstance, { foreignKey: "eventId", as: "tickets" });
// TicketInstance.belongsTo(EventInstance, { foreignKey: "eventId", as: "event" });

import { DataTypes, Model } from "sequelize";
import { db } from "../config";
import { EventInstance } from "./eventModel";

export interface TicketAttribute {
  id: string;
  eventId: string;
  email: string;
  phone: string;
  fullName: string;
  ticketType: string;
  price: number;
  purchaseDate: Date;
  qrCode: string;
  validationStatus: "Valid" | "Used" | "Expired" | "Invalid";
  seatNumber?: string;
  paid: boolean;
  currency: string;
  flwRef?: string;
  attendees?: { name: string; email: string }[];
}

export class TicketInstance extends Model<TicketAttribute> {}

TicketInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    eventId: {
      type: DataTypes.UUID,
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
      defaultValue: DataTypes.NOW,
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    validationStatus: {
      type: DataTypes.ENUM("Valid", "Used", "Expired", "Invalid"),
      allowNull: false,
      defaultValue: "Invalid",
    },
    seatNumber: {
      type: DataTypes.STRING,
      allowNull: true,
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
        isValidArray(value: any) {
          if (value && !Array.isArray(value)) {
            throw new Error("Attendees must be an array of objects");
          }
        },
      },
    },
  },
  {
    sequelize: db,
    tableName: "tickets",
  }
);

EventInstance.hasMany(TicketInstance, { foreignKey: "eventId", as: "tickets" });
TicketInstance.belongsTo(EventInstance, { foreignKey: "eventId", as: "event" });
