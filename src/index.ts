import dotenv from "dotenv";
dotenv.config();

import express, { Application, Request, Response } from "express";
import cors from "cors";
import logger from "morgan";
import helmet from "helmet";
import cron from "node-cron";
import client from "prom-client";

import { db, port, URL } from "./config";
import userRouter from "./routes/user";
import eventRouter from "./routes/event";
import ticketRouter from "./routes/ticket";
import notificationRouter from "./routes/notification";
import paymentRoutes from "./routes/payment";
import { deleteExpiredEvents } from "./controllers/eventCtrl";

db.sync()
  .then(() => console.log("✅ Database connected successfully"))
  .catch((err) => console.error("❌ Database connection failed:", err));

const app: Application = express();
const collectDefaultMetrics = client.collectDefaultMetrics;

// Enable Prometheus metrics collection
collectDefaultMetrics();

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(logger("dev"));
app.use(helmet());
app.use(cors());
// app.use(limiter);

app.use("/api/v1/users", userRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/tickets", ticketRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/payment", paymentRoutes);

cron.schedule("0 0 * * *", async () => {
  console.log("🕒 Running daily cleanup for expired events...");
  try {
    await deleteExpiredEvents();
    console.log("✅ Expired events deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting expired events:", error);
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send(`
      <h1>WELCOME TO THE EVENT CREATION APP!</h1>
      <p>This platform allows users to effortlessly create and manage events, while also providing an easy way for attendees to purchase tickets...</p>
  `);
});

const server = app.listen(port, () => {
  console.log(`🚀 Server running on ${URL}:${port}`);
});

server.on("error", (error) => {
  console.error(`❌ Server error: ${error.message}`);
});
