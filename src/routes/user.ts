import express from "express";
import {
  changePassword,
  getProfile,
  login,
  passwordRecovery,
  register,
  resendVerificationOTP,
  updateProfile,
  uploadPicture,
  verifyOTP,
} from "../controllers/userCtrl";
import { auth } from "../middlewares/auth";
import upload from "../utilities/multer";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/verify-otp", verifyOTP);
userRouter.get("/resend-otp", resendVerificationOTP);
userRouter.post("/login", login);
userRouter.patch("/change-password", auth, changePassword);
userRouter.patch("/password-recovery", auth, passwordRecovery);
userRouter.get("/profile", auth, getProfile);
userRouter.patch("/profile", auth, updateProfile);
userRouter.patch("/upload-image", auth, upload.single("file"), uploadPicture);
export default userRouter;
