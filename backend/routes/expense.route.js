import { Router } from "express";

import {
  getExpensesController,
  createExpenseController,
  aiSplitController,
  paymentController,
} from "../controllers/expense.controller.js";

import auth from "../middlewares/auth.js";

const expenseRouter = Router();

expenseRouter.get("/", auth, getExpensesController);
expenseRouter.post("/", auth, createExpenseController);
expenseRouter.post("/ai-split", auth, aiSplitController);
expenseRouter.post("/pay", auth, paymentController);

export default expenseRouter;
