import express from "express";
import {
  changePassword,
  login,
  passwordRecovery,
  register,
} from "../controllers/userCtrl";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.patch("/change-password", changePassword);
userRouter.patch("/password-recovery", passwordRecovery);

export default userRouter;
