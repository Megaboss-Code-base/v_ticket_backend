import express from "express";
import {
  getAllEvents,
  deleteEvent,
  updateCommissionRate,
  getAllUsers,
  promoteUserToAdmin,
  getTicketStats,
  getTransactions,
} from "../controllers/adminCtrl";
import { auth, adminAuth } from "../middlewares/auth";

const router = express.Router();

// Event Management
router.get("/events", auth, adminAuth, getAllEvents);
router.delete("/events/:id", auth, adminAuth, deleteEvent);
router.patch("/events/:id/commission", auth, adminAuth, updateCommissionRate);

// User Management
router.get("/users", auth, adminAuth, getAllUsers);
router.patch("/users/:id/promote", auth, adminAuth, promoteUserToAdmin);

// Stats & Analytics
router.get("/stats/tickets", auth, adminAuth, getTicketStats);
router.get("/transactions", auth, adminAuth, getTransactions );

export default router;
