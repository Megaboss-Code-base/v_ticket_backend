import express, { Application, Request, Response } from "express";
import cors from "cors";
import logger from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";

import { db, port, URL } from "./config";
import userRouter from "./routes/user";

dotenv.config();

db.sync()
  .then(() => {
    console.log("DB connected successfully");
  })
  .catch((err:any) => {
    console.log(err);
  });

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(helmet());
app.use(cors());

app.use("/api/v1/users", userRouter);

try {
  app.listen(port, () => {
    console.log(`Server running on ${URL}:${port}`);
  });
} catch (error: any) {
  console.log(`Error occurred: ${error.message}`);
}
