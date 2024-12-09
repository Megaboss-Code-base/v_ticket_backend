import { DataTypes, Model } from "sequelize";
import sequelize  from "../config";

import { IEvent } from "../interface/event.interface";

class Event extends Model<IEvent> implements IEvent {
    public id!: string;
    public title!: string;
    public description!: string;
    public date!: Date;
    public location!: string;
    public price!: number;
    public ticketType!: 'BASIC' | 'VIP';
    public readonly createdAt?: Date;
    public readonly updatedAt?: Date;
  }
  
  Event.init(
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
      date: {
        type: DataTypes.DATE,
        // allowNull: false,
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
        type: DataTypes.ENUM('BASIC', 'VIP'),
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'events',
      timestamps: true
    }
  );

  export default Event