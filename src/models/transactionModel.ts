import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { db } from "../config";
import { TicketInstance } from "./ticketModel";
import { UserInstance } from "./userModel";

export interface TransactionAttribute {
  id: string;
  userId: string;
  ticketId: string;
  totalAmount: number;
  paymentStatus: "Pending" | "Completed" | "Failed" | "Refunded";
  paymentReference: string;
  currency: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export class TransactionInstance extends Model<
  InferAttributes<TransactionInstance>,
  InferCreationAttributes<TransactionInstance>
> {
  declare id: string;
  declare userId: string;
  declare ticketId: string;
  declare totalAmount: number;
  declare paymentStatus: "Pending" | "Completed" | "Failed" | "Refunded";
  declare paymentReference: string;
  declare currency: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TransactionInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    ticketId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "tickets",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM("Pending", "Completed", "Failed", "Refunded"),
      allowNull: false,
      defaultValue: "Pending",
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
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
    tableName: "transactions",
    timestamps: true,
  }
);

UserInstance.hasMany(TransactionInstance, {
  foreignKey: "userId",
  as: "transactions",
});
TransactionInstance.belongsTo(UserInstance, {
  foreignKey: "userId",
  as: "user",
});

TicketInstance.hasMany(TransactionInstance, {
  foreignKey: "ticketId",
  as: "transactions",
});
TransactionInstance.belongsTo(TicketInstance, {
  foreignKey: "ticketId",
  as: "ticket",
});

export default TransactionInstance;
