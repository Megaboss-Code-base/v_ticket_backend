import { DataTypes, Model } from "sequelize";
import { db } from "../config";

export interface UserAttributes {
  id?: string;
  profilePic: string;
  fullName: string;
  businessName?: string;
  email: string;
  phone: string;
  companyWebsite?: string;
  address?: string;
  password: string;
  role: string;
  timezone?: string;
}

export class User extends Model<UserAttributes> implements UserAttributes {
  public id!: string;
  public profilePic!: string;
  public fullName!: string;
  public businessName?: string;
  public email!: string;
  public phone!: string;
  public companyWebsite?: string;
  public address?: string;
  public password!: string;
  public role!: string;
  public timezone?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    profilePic: {
      type: DataTypes.STRING,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    businessName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
    },
    companyWebsite: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 30], // Validates password length between 5 and 30 characters
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["user", "admin", "vendor"]],
      },
    },
    timezone: {
      type: DataTypes.STRING,
    },
  },
  {
    sequelize: db, // Pass your Sequelize instance
    tableName: "migrationUser",
  }
);
