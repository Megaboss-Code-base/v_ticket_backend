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
  id: number;
  email: string;
  fullName: string;
  ticketId: string;
  totalAmount: number;
  paymentStatus: string;
  paymentReference: string;
  currency: string;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
}

export class TransactionInstance extends Model<
  InferAttributes<TransactionInstance>,
  InferCreationAttributes<TransactionInstance>
> {
  declare id: number;
  declare email: string;
  declare fullName: string;
  declare ticketId: string;
  declare totalAmount: number;
  declare paymentStatus: string;
  declare paymentReference: string;
  declare currency: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

TransactionInstance.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
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
