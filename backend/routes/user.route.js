import { Router } from "express";

import {
  loginController,
  logoutHandler,
  registerController,
  updateUserController,
  verifyEmailController,
  forgotPasswordController,
  verifyForgotPWD,
  resetPWD,
} from "../controllers/user.controller.js";
import auth from "../middlewares/auth.js";

const userRouter = Router();

userRouter.post("/login", loginController);
userRouter.post("/register", registerController);
userRouter.patch("/verify-email", verifyEmailController);
userRouter.post("/logout", auth, logoutHandler);
userRouter.put("/edit", auth, updateUserController);
userRouter.post("/forgot-password", forgotPasswordController);
userRouter.post("/verify-forgot-password-otp", verifyForgotPWD);
userRouter.post("/reset-password", resetPWD);

export default userRouter;
