import { Router } from "express";
import { loginController, registerController } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/login",loginController);
userRouter.post("/register", registerController);

export default userRouter;
