import { DataTypes, Model } from "sequelize";
import { db } from "../config";
import { EventInstance } from "./eventModel";

export interface ModeratorAttribute {
  id: string;
  eventId: string;
  userEmail: string;
}

export class ModeratorInstance extends Model<ModeratorAttribute> {}

ModeratorInstance.init(
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
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "moderators",
  }
);

EventInstance.hasMany(ModeratorInstance, { foreignKey: "eventId", as: "moderators" });
ModeratorInstance.belongsTo(EventInstance, { foreignKey: "eventId", as: "event" });
