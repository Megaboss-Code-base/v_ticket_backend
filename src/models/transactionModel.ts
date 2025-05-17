import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { db } from "../config";
import { TicketInstance } from "./ticketModel";

export interface TransactionAttribute {
  id: string;
  email: string;
  fullName: string;
  ticketId: string;
  totalAmount: number;
  paymentStatus: string;
  paymentReference: string;
  currency: string;
  transferStatus?: string;
  transferReference?: string | null;
  transferError?: string | null;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export class TransactionInstance extends Model<
  InferAttributes<TransactionInstance>,
  InferCreationAttributes<TransactionInstance>
> {
  declare id: string;
  declare email: string;
  declare fullName: string;
  declare ticketId: string;
  declare totalAmount: number;
  declare paymentStatus: string;
  declare paymentReference: string;
  declare currency: string;
  declare transferStatus: string| null;
  declare transferReference: string | null;
  declare transferError: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TransactionInstance.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    paymentReference: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transferStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "pending", // Default status
    },
    transferReference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transferError: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
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

TicketInstance.hasMany(TransactionInstance, {
  foreignKey: "ticketId",
  as: "transactions",
});
TransactionInstance.belongsTo(TicketInstance, {
  foreignKey: "ticketId",
  as: "ticket",
});

export default TransactionInstance;
