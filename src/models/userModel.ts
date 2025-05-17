import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import { db } from "../config";

export class UserInstance extends Model<
  InferAttributes<UserInstance>,
  InferCreationAttributes<UserInstance>
> {
  declare id: string;
  declare fullName: string;
  declare email: string;
  declare password: string;
  declare profilePic: string;
  declare role: "user" | "admin";
  declare phone: string;
  declare businessName: string;
  declare companyWebsite: string;
  declare address: string;
  declare timezone: string;
  declare country: string;
  declare currency: string;
  declare isVerified: boolean;
  declare userValidationSecret: CreationOptional<string | null>;
  declare otpVerificationExpiry: CreationOptional<Date | null>;
  declare account_name: CreationOptional<string | null>;
  declare account_code: CreationOptional<string | null>;
  declare account_bank: CreationOptional<string | null>;
  declare account_number: CreationOptional<string | null>;
  declare account_country: CreationOptional<string | null>;
  declare paystackRecipientCode: CreationOptional<string | null | undefined>;
  declare totalEarnings: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profilePic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userValidationSecret: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    companyWebsite: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpVerificationExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    account_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_bank: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paystackRecipientCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalEarnings: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "users",
  }
);

export default UserInstance;
