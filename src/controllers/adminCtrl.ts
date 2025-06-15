import { Request, Response } from "express";
import EventInstance from "../models/eventModel";
import TicketInstance from "../models/ticketModel";
import UserInstance from "../models/userModel";
import TransactionInstance from "../models/transactionModel";
import { JwtPayload } from "jsonwebtoken";

export const getAllEvents = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const events = await EventInstance.findAll({
      include: [
        { model: TicketInstance, as: "tickets" },
        { model: UserInstance, as: "user", attributes: ["fullName"] },
      ],
    });
    return res.status(200).json({ data: events });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
};

export const deleteEvent = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    await EventInstance.destroy({ where: { id } });
    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
};

export const updateCommissionRate = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const { rate } = req.body;

    const event = await EventInstance.findByPk(id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    event.commissionRate = rate;
    await event.save();

    return res.status(200).json({ data: event });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
};

export const getAllUsers = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const users = await UserInstance.findAll();
    return res.status(200).json({ data: users });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
};

export const promoteUserToAdmin = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const user = await UserInstance.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = "admin";
    await user.save();

    return res.status(200).json({ data: user });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
};

export const getTicketStats = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const totalTicketsSold = await TicketInstance.count();
    const totalRevenue = await TransactionInstance.sum("totalAmount");

    return res.status(200).json({
      totalTicketsSold,
      totalRevenue,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server Error" });
  }
};

export const getTransactions = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const transactions = await TransactionInstance.findAll({
      include: [
        {
          model: TicketInstance,
          as: "ticket",
          include: [
            {
              model: EventInstance,
              as: "event",
              attributes: ["title", "userId"],
            },
          ],
        },
      ],
    });

    return res.status(200).json({ data: transactions });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Server Error fetching transactions" });
  }
};
