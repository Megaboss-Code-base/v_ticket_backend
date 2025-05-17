import { Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UserInstance } from "../models/userModel";

export const auth = async (
  req: JwtPayload,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Authentication token is missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const { id } = decoded;
    if (!id) {
      return res.status(401).json({ error: "Invalid token structure" });
    }

    const user = await UserInstance.findOne({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: "User is not verified" });
    }
    req.user = id;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const adminAuth = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = await UserInstance.findOne({
      where: { id: req.user },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    next();
  } catch (error: any) {
    return res.status(500).json({
      error: "An error occurred during role verification",
      details: error.message,
    });
  }
};
