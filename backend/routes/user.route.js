import { Router } from "express";
import { loginController } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/login",loginController);

export default userRouter;
