import { DataTypes, Model } from "sequelize";
import { db } from "../config";
import { UserInstance } from "./userModel";

export interface NotificationAttribute {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  userId: string;
}

export class NotificationInstance extends Model<NotificationAttribute> {}

NotificationInstance.init(
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    tableName: "notifications",
  }
);

UserInstance.hasMany(NotificationInstance, { foreignKey: "userId", as: "notifications" });
NotificationInstance.belongsTo(UserInstance, { foreignKey: "userId", as: "user" });
