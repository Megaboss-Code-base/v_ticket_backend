import { Request, Response } from "express";
import { UserAttribute, UserInstance } from "../models/userModel";
import { v4 as uuidv4 } from "uuid";
import { userRegistrationSchema } from "../utilities/validation";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { EXPIRESIN, JWT_SECRET, SALT_ROUNDS } from "../config";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password } = req.body;

    const validateResult = userRegistrationSchema.validate(req.body);

    if (validateResult.error) {
      console.log("we got to this point", validateResult.error);
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
      name,
      phone,
      email: newEmail,
      password: userPassword,
      role: "user",
    });

    const { password: _, ...userWithoutPassword } = user.get({ plain: true });

    return res.status(201).json({
      message: "User created successfully ",
      user: userWithoutPassword,
    });
  } catch (error) {
    res.status(500).json({
      Error: "Internal server error",
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
    console.error(error);
    res.status(500).json({
      Error: "Internal server error",
      route: "users/login",
    });
  }
};
