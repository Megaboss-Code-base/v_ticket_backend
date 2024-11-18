
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const db = new Sequelize(process.env.DBCONNECTION_STRING!, {
  logging: false,
  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {
        ssl: false
      }
});

export const URL = process.env.URL as string;
export const port = process.env.PORT || 4000;