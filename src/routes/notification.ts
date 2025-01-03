import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationCtrl";
import { auth } from "../middlewares/auth";

const router = express.Router();

router.get("/", auth, getUserNotifications);
router.patch("/read/:id", auth, markNotificationAsRead);
router.delete("/:id", auth, deleteNotification);

export default router;
