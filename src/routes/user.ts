import express from "express";
import {
  changePassword,
  getProfile,
  login,
  passwordRecovery,
  register,
  resendVerificationOTP,
  updateProfile,
  verifyOTP,
} from "../controllers/userCtrl";
import { auth } from "../middlewares/auth";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/verify-otp", verifyOTP);
userRouter.get("/resend-otp", resendVerificationOTP);
userRouter.post("/login", login);
userRouter.patch("/change-password", auth, changePassword);
userRouter.patch("/password-recovery", auth, passwordRecovery);
userRouter.get('/profile', auth, getProfile);
userRouter.patch('/profile', auth, updateProfile);
export default userRouter;
