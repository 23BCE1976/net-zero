import { Router } from "express";
import { registerController } from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.post("/register", registerController);

export default userRouter;
