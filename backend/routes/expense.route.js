import { Router } from "express";

import {
  getAllController,
  createExpenseController,
  paymentController
} from "../controllers/expense.controller.js";

import auth from "../middlewares/auth.js";

const expenseRouter = Router();

expenseRouter.get("/", auth, getAllController);
expenseRouter.post("/", auth, createExpenseController);
expenseRouter.post("/pay", auth, paymentController);

export default expenseRouter;
