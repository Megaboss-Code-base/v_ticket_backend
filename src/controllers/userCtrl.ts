import { Request, Response } from "express";
import { UserAttribute, UserInstance } from "../models/userModel";
import { v4 as uuidv4 } from "uuid";
import { userRegistrationSchema } from "../utilities/validation";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  EXPIRESIN,
  generateRandomAlphaNumeric,
  JWT_SECRET,
  SALT_ROUNDS,
} from "../config";

export const register = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      phone,
      email,
      password,
      profilePic,
      businessName,
      companyWebsite,
      address,
      timezone,
    } = req.body;

    const validateResult = userRegistrationSchema.validate(req.body);

    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message,
      });
    }

    const newEmail = email.trim().toLowerCase();
    const User = await UserInstance.findOne({ where: { email: newEmail } });
    if (User) {
      return res.status(400).json({
        Error: "Email already exists",
      });
    }
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const userPassword = (await bcrypt.hash(password, salt)) as string;

    const user = await UserInstance.create({
      id: uuidv4(),
      fullName,
      phone,
      email: newEmail,
      password: userPassword,
      role: "user",
      profilePic,
      businessName,
      companyWebsite,
      address,
      timezone,
    });

    const { password: _, ...userWithoutPassword } = user.get({ plain: true });

    return res.status(201).json({
      message: "User created successfully ",
      user: userWithoutPassword,
    });
  } catch (error: any) {
    res.status(500).json({
      Error: `Internal server error: ${error.message}`,
      route: "users/register",
    });
  }
};

export const login = async (req: Request, res: Response) => {
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

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        Error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email!, role: user.role },
      JWT_SECRET!,
      { expiresIn: EXPIRESIN! }
    );

    user.password = undefined!;
    return res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      route: "users/login",
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
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

export const passwordRecovery = async (req: Request, res: Response) => {
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

    await UserInstance.update(
      { password: userPassword },
      { where: { email: newEmail } }
    );

    return res.status(200).json({
      message: "Password successfully updated",
      password: resetPassword,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
      route: "users/password-recovery",
    });
  }
};
