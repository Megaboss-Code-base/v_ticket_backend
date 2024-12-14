import { DataTypes, Model } from "sequelize";
import { db } from "../config";
import { UserInstance } from "./userModel";

export interface EventAttribute {
  id: string;
  title: string;
  description: string;
  image: string;
  date: Date;
  location: string;
  price: string;
  ticketType: Record<string, number>;
  userId: string;
  quantity: number;
  sold: number;    
}

export class EventInstance extends Model<EventAttribute> {}

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
    price: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ticketType: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, 
    },
    sold: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, 
    },
  },
  {
    sequelize: db,
    tableName: "events",
  }
);

UserInstance.hasMany(EventInstance, { foreignKey: "userId", as: "events" });
EventInstance.belongsTo(UserInstance, { foreignKey: "userId", as: "user" });
