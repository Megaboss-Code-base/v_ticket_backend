import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const db = new Sequelize(process.env.DBCONNECTION_STRING!, {
  logging: false,
  dialect: "postgres",
  dialectOptions: isProduction
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {
        ssl: false,
      },
});

export const URL = process.env.URL as string;
export const port = process.env.PORT || 4000;
export const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS!);
export const JWT_SECRET = process.env.JWT_SECRET!;
export const EXPIRESIN = process.env.EXPIRESIN!;
export const REFRESH_EXPIRESIN = process.env.REFRESH_EXPIRESIN!;
export const resetPasswordExpireMinutes = parseInt(
  process.env.RESET_PASSWORD_EXPIRE_MINUTES!
);
export const resetPasswordExpireUnit = process.env
  .RESET_PASSWORD_EXPIRE_UNIT! as string;
export const CLOUDINARY_URL = process.env.CLOUDINARY_URL!;
export const FLUTTERWAVE_PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY!;
export const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
export const BASE_URL = process.env.BASE_URL!;
export const FRONTEND_URL = process.env.FRONTEND_URL!;
export const FLUTTERWAVE_BASE_URL = process.env.FLUTTERWAVE_BASE_URL!;
export const ACCOUNT_ID = process.env.ACCOUNT_ID!;
export const FLUTTERWAVE_HASH_SECRET = process.env.FLUTTERWAVE_HASH_SECRET!;
export const ACCOUNT_OWNER_ID = process.env.ACCOUNT_OWNER_ID! as string;

export function generateRandomAlphaNumeric(length: any) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function generateTicketSignature(ticketId: string): string {
  const secret = process.env.TICKET_SECRET_KEY || "your_secret_key";
  return crypto.createHmac("sha256", secret).update(ticketId).digest("hex");
}

export function verifyTicketSignature(ticketId: string, signature: string): boolean {
  const secret = process.env.SECRET_KEY || "your_secret_key";
  const expectedSignature = crypto.createHmac("sha256", secret).update(ticketId).digest("hex");
  return signature === expectedSignature;
}

export const validateFlutterwaveWebhook = (payload: string, signature: string) => {
  const hash = crypto
    .createHmac("sha256", FLUTTERWAVE_HASH_SECRET)
    .update(payload)
    .digest("hex");
  return hash === signature;
};

// In handleWebhook
// const isValidWebhook = validateFlutterwaveWebhook(
//   JSON.stringify(req.body),
//   req.headers["verif-hash"] as string
// );

// if (!isValidWebhook) {
//   return res.status(401).json({ error: "Invalid webhook signature" });
// }

