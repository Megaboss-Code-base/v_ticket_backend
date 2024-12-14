import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  deleteNotification,
} from "../controllers/notificationCtrl";

const router = express.Router();

router.get("/:userId", getUserNotifications); 
router.patch("/read/:id/:userId", markNotificationAsRead);
router.delete("/:id/:userId", deleteNotification);

export default router;