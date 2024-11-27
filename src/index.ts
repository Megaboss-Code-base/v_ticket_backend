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
  .catch((err: any) => {
    console.log(err);
  });

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger("dev"));
app.use(helmet());
app.use(cors());

app.use("/api/v1/users", userRouter);

app.get("/", (req, res) => {
  res.send(`
      WELCOME TO THE EVENT CREATION APP!<br><br>
      This platform allows users to effortlessly create and manage events, while also providing an easy way for attendees to purchase tickets. 
      Whether you are hosting a concert, conference, or party, our app makes the event creation process simple and streamlined. 
      Users can create events, customize event details, and start selling tickets within minutes. 
      Attendees can browse through upcoming events, choose the tickets they want, and make secure purchases all in one place. 
      We aim to make event management and ticket purchasing accessible and efficient for everyone. 
      Get started now and experience the convenience of organizing your next event with us!
  `);
});

try {
  app.listen(port, () => {
    console.log(`Server running on ${URL}:${port}`);
  });
} catch (error: any) {
  console.log(`Error occurred: ${error.message}`);
}
