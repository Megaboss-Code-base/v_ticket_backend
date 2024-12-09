import { DataTypes, Model } from "sequelize";
import { db } from "../config";
import { IEvent } from "../interface/event.interface";

class Event extends Model<IEvent> implements IEvent {
  // Avoid declaring public class fields for attributes
  public readonly id!: string;
  public readonly title!: string;
  public readonly description!: string;
  public readonly date!: Date;
  public readonly location!: string;
  public readonly price!: number;
  public readonly ticketType!: "BASIC" | "VIP";
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    ticketType: {
      type: DataTypes.ENUM("BASIC", "VIP"),
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "events",
    timestamps: true,
  }
);

export default Event;
