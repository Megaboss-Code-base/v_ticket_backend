import { DataTypes, Model } from "sequelize";
import { db } from "../config";

export interface UserAttribute {
  id: string;
  fullName: string;
  email: string;
  password: string;
  profilePic: string;
  role: "user" | "admin";
  phone: string;
  businessName: string;
  companyWebsite: string;
  address: string;
  timezone: string;
  country: string;
  isVerified: boolean;
  userValidationSecret: string | null;
  otpVerificationExpiry: Date | null;
  account_bank: string | null;
  account_number: string | null;
  totalEarnings: number;
}

export class UserInstance extends Model<UserAttribute> {}

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
    otpVerificationExpiry: {
      type: DataTypes.DATE,
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
    totalEarnings: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize: db,
    tableName: "users",
  }
);
