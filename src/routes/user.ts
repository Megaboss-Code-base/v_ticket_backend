import express from "express";
import {
  allUsers,
  changePassword,
  getMonthlyRegistrations,
  getProfile,
  login,
  passwordRecovery,
  register,
  resendVerificationOTP,
  updateProfile,
  uploadPicture,
  verifyOTP,
} from "../controllers/userCtrl";
import { adminAuth, auth } from "../middlewares/auth";
import upload from "../utilities/multer";

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/verify-otp", verifyOTP);
userRouter.post("/resend-otp", resendVerificationOTP);
userRouter.post("/login", login);
userRouter.patch("/change-password", auth, changePassword);
userRouter.patch("/password-recovery", passwordRecovery);
userRouter.get("/profile", auth, getProfile);
userRouter.patch("/profile", auth, updateProfile);
userRouter.patch("/upload-image", auth, upload.single("file"), uploadPicture);
userRouter.get(
  "/registrations/monthly",
  auth,
  adminAuth,
  getMonthlyRegistrations
);
userRouter.get(
  "/all-users",
  // auth,
  // adminAuth,
  allUsers
);

export default userRouter;
