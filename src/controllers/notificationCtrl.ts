import { Response } from "express";
import { NotificationInstance } from "../models/notificationModel";
import { JwtPayload } from "jsonwebtoken";

export const getUserNotifications = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Please log in to view notifications" });
    }

    const notifications = await NotificationInstance.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    if (!notifications || notifications.length === 0) {
      return res.status(404).json({ message: "No notifications found" });
    }

    return res
      .status(200)
      .json({ counts: notifications.length, notifications });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error fetching notifications", error: error.message });
  }
};

export const markNotificationAsRead = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user;

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Please log in to mark notifications" });
    }

    const notification = await NotificationInstance.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await NotificationInstance.update(
      { isRead: true },
      {
        where: {
          id,
          userId,
        },
      }
    );

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error updating notification", error: error.message });
  }
};

export const deleteNotification = async (
  req: JwtPayload,
  res: Response
): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: Please log in to delete notifications",
      });
    }

    const notification = await NotificationInstance.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.destroy();
    return res
      .status(200)
      .json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: "Error deleting notification", error: error.message });
  }
};
