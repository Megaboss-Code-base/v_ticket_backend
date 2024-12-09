import { DataTypes, Model } from "sequelize";
import { db } from "../config";

export interface UserAttribute {
  id: string;
  fullName: string;
  email: string;
  password: string;
  profilePic: string;
  role: string;
  phone: string;
  businessName: string;
  companyWebsite: string;
  address: string;
  timezone: string;
  resetPasswordToken: string | null;
  resetPasswordExpire: Date | null;
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
    profilePic: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "https://mighty.tools/mockmind-api/content/abstract/41.jpg",
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
    businessName: {
      type: DataTypes.STRING,
      allowNull: true,
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
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize: db,
    tableName: "user",
  }
);
