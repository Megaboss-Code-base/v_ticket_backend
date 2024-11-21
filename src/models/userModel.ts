import { DataTypes, Model } from "sequelize";
import { db } from "../config";

export interface UserAttribute {
  id: string;
  phone: string;
  name: string;
  email: string;
  password: string;
  role: string;
}
export class UserInstance extends Model<UserAttribute> {}

UserInstance.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Please input phone number",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Email address is required",
        },
        isEmail: {
          msg: "Please provide a valid email",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Please input password",
        },
      },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: {
          args: [["user", "admin", "vendor"]],
          msg: "Role must be either 'user', 'admin', or 'vendor'",
        },
      },
    },
  },
  {
    sequelize: db,
    tableName: "user",
  }
);
