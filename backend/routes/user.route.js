import { Router } from "express";

import {
  loginController,
  logoutController,
  registerController,
  updateUserController,
  verifyEmailController,
  checkVerifyStatus,
  profileController,
  forgotPasswordController,
  verifyForgotPWDController,
  resetPWDController,
} from "../controllers/user.controller.js";

import auth from "../middlewares/auth.js";

const userRouter = Router();

userRouter.post("/login", loginController);
userRouter.post("/register", registerController);
userRouter.patch("/verify-email", verifyEmailController);
userRouter.get("/check-verify-status", checkVerifyStatus);
userRouter.post("/logout", auth, logoutController);
userRouter.get("/profile", auth, profileController);
userRouter.put("/edit", auth, updateUserController);
userRouter.post("/forgot-password", forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", verifyForgotPWDController);
userRouter.post("/reset-password", resetPWDController);

export default userRouter;
