import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

export const db = new Sequelize(process.env.DBCONNECTION_STRING!, {
  logging: false,
  dialect: "postgres",
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
export const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS!);
export const JWT_SECRET = process.env.JWT_SECRET!
export const EXPIRESIN = process.env.EXPIRESIN!
export const resetPasswordExpireMinutes = parseInt(process.env.RESET_PASSWORD_EXPIRE_MINUTES!);
export const resetPasswordExpireUnit = process.env.RESET_PASSWORD_EXPIRE_UNIT! as string;
export const CLOUDINARY_URL = process.env.CLOUDINARY_URL!;

export function generateRandomAlphaNumeric(length:any) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
