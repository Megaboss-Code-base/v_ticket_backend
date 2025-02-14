import { Request, Response } from "express";
import { UserAttribute, UserInstance } from "../models/userModel";
import { v4 as uuidv4 } from "uuid";
import { userRegistrationSchema } from "../utilities/validation";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import speakeasy from "speakeasy";
import dayjs, { ManipulateType } from "dayjs";
import { Sequelize } from "sequelize";

import {
    db,
    EXPIRESIN,
    generateRandomAlphaNumeric,
    JWT_SECRET,
    REFRESH_EXPIRESIN,
    resetPasswordExpireMinutes,
    resetPasswordExpireUnit,
    SALT_ROUNDS,
  } from "../config";
  import sendEmail from "../utilities/sendMail";


export const verifyOTP = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, secret } = req.body;

    const newEmail = email.trim().toLowerCase();

    const user = (await UserInstance.findOne({
      where: { email: newEmail },
    })) as unknown as UserAttribute;

    if (!user) {
      return res.status(404).json({ Error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    if (dayjs().isAfter(dayjs(user.otpVerificationExpiry))) {
      return res.status(400).json({
        message: "Verification code expired. Please request a new one.",
      });
    }

    if (secret !== user.userValidationSecret) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    await UserInstance.update(
      {
        isVerified: true,
        userValidationSecret: null,
        otpVerificationExpiry: null,
      },
      { where: { email: user.email } }
    );

    return res.status(200).json({ message: "Account verified successfully" });
  } catch (error: any) {
    res.status(500).json({
      Error: `Internal server error: ${error.message}`,
      route: "users/verify",
    });
  }
};

export const resendVerificationOTP = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email } = req.body;

    const newEmail = email.trim().toLowerCase();

    const user = (await UserInstance.findOne({
      where: { email: newEmail },
    })) as unknown as UserAttribute;

    if (!user) {
      return res.status(404).json({ Error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    const userValidationSecret = speakeasy.generateSecret().base32;
    const otpVerificationExpiry = dayjs()
      .add(
        resetPasswordExpireMinutes,
        resetPasswordExpireUnit as ManipulateType
      )
      .toDate();

    user.userValidationSecret = userValidationSecret;
    user.otpVerificationExpiry;

    await UserInstance.update(
      {
        userValidationSecret,
        otpVerificationExpiry,
      },
      { where: { email: user.email } }
    );

    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/auth/verify-otp/${userValidationSecret}`;

    const message = `You are receiving this email because you (or someone else) has requested for an OTP. Please make a POST request to: \n\n ${resetUrl}. This OTP will expire in the next 10 mins`;

    await sendEmail({
      email: newEmail,
      subject: "Verify Your Account",
      message,
    });

    return res.status(200).json({
      message:
        "Verification code resent successfully. Please check your email.",
    });
  } catch (error: any) {
    res.status(500).json({
      Error: `Internal server error: ${error.message}`,
      route: "users/resend-verification",
    });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    const newEmail = email.trim().toLowerCase();

    const user = (await UserInstance.findOne({
      where: { email: newEmail },
    })) as unknown as UserAttribute;
    if (!user) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    if (user.isVerified === false) {
      return res.status(400).json({
        Error:
          "Your account has not been verified please request for an otp by clicking the button below",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email!, role: user.role },
      JWT_SECRET!,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email!, role: user.role },
      JWT_SECRET!,
      { expiresIn: "7h" }
    );

    user.password = undefined!;
    return res.status(200).json({
      message: "Login successful",
      token,
      refreshToken,
      user,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      route: "users/login",
    });
  }
};