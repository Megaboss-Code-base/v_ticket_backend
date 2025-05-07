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
  FRONTEND_URL,
  generateRandomAlphaNumeric,
  JWT_SECRET,
  REFRESH_EXPIRESIN,
  resetPasswordExpireMinutes,
  resetPasswordExpireUnit,
  SALT_ROUNDS,
} from "../config";
import sendEmail from "../utilities/sendMail";

export const register = async (req: Request, res: Response): Promise<any> => {
  const transaction = await db.transaction();
  try {
    const {
      fullName,
      phone,
      email,
      password,
      businessName,
      companyWebsite,
      address,
      timezone,
      country,
      currency,
    } = req.body;

    const validateResult = userRegistrationSchema.validate(req.body);

    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    const newEmail = email.trim().toLowerCase();
    const existingUser = await UserInstance.findOne({
      where: { email: newEmail },
      transaction,
    });

    if (existingUser) {
      return res.status(400).json({
        Error: "Email already exists",
      });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const userPassword = await bcrypt.hash(password, salt);

    const userValidationSecret = speakeasy.generateSecret().base32;
    const otpVerificationExpiry = dayjs()
      .add(
        resetPasswordExpireMinutes,
        resetPasswordExpireUnit as ManipulateType
      )
      .toDate();

    const user = await UserInstance.create(
      {
        id: uuidv4(),
        fullName,
        phone,
        email: newEmail,
        password: userPassword,
        role: "user",
        profilePic:
          "https://images.squarespace-cdn.com/content/v1/54642373e4b024e8934bf4f4/8c711e5f-367a-43a8-8d43-ef18a3a04508/the+citadel.jpg",
        businessName,
        companyWebsite,
        address,
        timezone,
        country: country || "",
        currency: currency || "",
        userValidationSecret,
        otpVerificationExpiry,
        isVerified: false,
        totalEarnings: 0,
      },
      { transaction }
    );

    const {
      password: _,
      userValidationSecret: __,
      ...userWithoutSensitiveData
    } = user.get({ plain: true });

    const resetUrl = `${FRONTEND_URL}/auth/verify-otp/${newEmail}/${userValidationSecret}`;

    const message = `You are receiving this email because you (or someone else) has requested for an OTP. Please make a POST request to: \n\n ${resetUrl}. This OTP will expire in the next 10 mins`;

    await sendEmail({
      email: newEmail,
      subject: "Register Successfully",
      message,
    });

    await transaction.commit();

    return res.status(201).json({
      message:
        "User created successfully. Please check your email to verify your account.",
      user: userWithoutSensitiveData,
    });
  } catch (error: any) {
    await transaction.rollback();
    res.status(500).json({
      Error: `Internal server error: ${error.message}`,
      route: "users/register",
    });
  }
};

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

    await sendEmail({
      email: newEmail,
      subject: "Register Successfully",
      message: `Account verified successfully`,
    });

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

    const resetUrl = `${FRONTEND_URL}/auth/verify-otp/${newEmail}/${userValidationSecret}`;

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

export const changePassword = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { email, previousPassword, newPassword } = req.body;

    if (!email || !previousPassword || !newPassword) {
      return res.status(400).json({
        Error: "Fill all the fields",
      });
    }

    if (newPassword && (newPassword.length < 5 || newPassword.length > 30)) {
      return res.json({
        error: "Password should be between 5 and 30 characters",
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

    const isPasswordValid = await bcrypt.compare(
      previousPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({
        Error: "Please check your previous password",
      });
    }

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const userPassword = (await bcrypt.hash(newPassword, salt)) as string;

    await UserInstance.update(
      { password: userPassword },
      { where: { email: newEmail } }
    );

    return res.status(200).json({
      message: "Password successfully updated",
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      route: "users/change-password",
    });
  }
};

export const passwordRecovery = async (
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
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    const resetPassword = generateRandomAlphaNumeric(7);

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const userPassword = (await bcrypt.hash(resetPassword, salt)) as string;

    const updatedPassword = await UserInstance.update(
      { password: userPassword },
      { where: { email: newEmail } }
    );

    if (updatedPassword) {
      // const resetUrl = `${FRONTEND_URL}/auth/resetpassword/${userPassword}`;

      const message = `You are receiving this email because you (or someone else) has requested the reset of your password. Here is your new password ${resetPassword}. You can reset when yo login`;

      try {
        await sendEmail({
          email: user.email,
          subject: "Password reset token",
          message,
        });

        return res.status(200).json({ success: true, data: "Email sent" });
      } catch (err: any) {
        return res
          .status(500)
          .json({ success: false, data: `Email not sent: ${err.message}` });
      }
    }
  } catch (error: any) {
    res.status(500).json({
      Error: `Internal server error ${error.message}`,
      route: "users/password-recovery",
    });
  }
};

export const getProfile = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user;

    const user = await UserInstance.findOne({
      where: { id: userId },
      attributes: {
        exclude: [
          "password",
          "userValidationSecret",
          "otpVerificationExpiry",
          "updatedAt",
          "createdAt",
          "id",
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ Error: "User not found" });
    }

    return res.status(200).json({
      message: "User profile fetched successfully",
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      Error: `Internal server error: ${error.message}`,
      route: "users/get-profile",
    });
  }
};

export const updateProfile = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user;
    const {
      fullName,
      phone,
      profilePic,
      businessName,
      companyWebsite,
      address,
      country,
      timezone,
      account_bank,
      account_number,
    } = req.body;

    const user = await UserInstance.findOne({
      where: { id: userId },
      attributes: {
        exclude: [
          "password",
          "userValidationSecret",
          "otpVerificationExpiry",
          "updatedAt",
          "createdAt",
          "id",
        ],
      },
    });

    if (!user) {
      return res.status(404).json({ Error: "User not found" });
    }

    const updateFields: any = {};

    if (fullName) updateFields.fullName = fullName;
    if (phone) updateFields.phone = phone;
    if (profilePic) updateFields.profilePic = profilePic;
    if (businessName) updateFields.businessName = businessName;
    if (companyWebsite) updateFields.companyWebsite = companyWebsite;
    if (address) updateFields.address = address;
    if (timezone) updateFields.timezone = timezone;
    if (country) updateFields.country = country;
    if (account_bank) updateFields.account_bank = account_bank;
    if (account_number) updateFields.account_number = account_number;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ Error: "No valid fields to update" });
    }

    await UserInstance.update(updateFields, { where: { id: userId } });

    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      Error: `Internal server error: ${error.message}`,
      route: "users/update-profile",
    });
  }
};

export const uploadPicture = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user;
    const fileUrl = req.file?.path;

    const user = await UserInstance.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(400).json({ message: "Please login" });
    }

    if (!fileUrl) {
      return res.status(400).json({ message: "File upload failed" });
    }

    await UserInstance.update(
      { profilePic: fileUrl },
      { where: { id: userId } }
    );

    return res.status(200).json({
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    res.status(500).json({
      Error: `Internal server error: ${error.message}`,
      route: "users/upload-image",
    });
  }
};

export const getMonthlyRegistrations = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const registrations = await UserInstance.findAll({
      attributes: [
        [
          Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt")),
          "month",
        ],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "totalRegistrations"],
      ],
      group: [Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt"))],
      order: [
        [
          Sequelize.fn("DATE_TRUNC", "month", Sequelize.col("createdAt")),
          "ASC",
        ],
      ],
    });

    const formattedData = registrations.map((record: any) => ({
      month: record.getDataValue("month"),
      totalRegistrations: record.getDataValue("totalRegistrations"),
    }));

    return res.status(200).json({ data: formattedData });
  } catch (error: any) {
    console.error("Error fetching monthly registrations:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const allUsers = async (req: Request, res: Response): Promise<any> => {
  try {
    const registrations = await UserInstance.findAll({
      attributes: {
        exclude: ["password", "totalEarnings", "userValidationSecret"],
      },
    });

    return res
      .status(200)
      .json({ count: registrations.length, data: registrations });
  } catch (error: any) {
    console.error("Error fetching monthly registrations:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
