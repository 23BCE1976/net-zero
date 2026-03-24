import { GoogleGenerativeAI } from "@google/generative-ai";

import groupModel from "../models/group.model.js";
import userModel from "../models/user.model.js";
import expenseModel from "../models/expense.model.js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export const getExpensesController = async (request, response) => {
  try {
    const user = await userModel.findById(request.userId);
    const { groupId } = request.query;

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const group = await groupModel.findById(groupId);

    if (!group.members.some((member) => member.userId.equals(user._id))) {
      return response.status(404).json({
        message: "Group not found",
        error: true,
        success: false,
      });
    }

    const expenses = await expenseModel.find({ groupId: groupId });

    return response.status(200).json({
      message: "Expenses fetched successfully",
      data: expenses,
      error: false,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

export const createExpenseController = async (request, response) => {
  try {
    const user = await userModel.findById(request.userId);
    const { groupId, title, amount, paidBy, splitType, splits } = request.body;

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (!title || amount == null || !paidBy || !splitType || splits == null) {
      return response.status(400).json({
        message: "Send the required fields",
        error: true,
        success: false,
      });
    }

    const group = await groupModel.findById(groupId);

    if (
      !group ||
      !group.members.some((member) => member.userId.equals(user._id))
    ) {
      return response.status(404).json({
        message: "Group not found",
        error: true,
        success: false,
      });
    }

    if (!group.members.some((member) => member.userId.equals(paidBy))) {
      return response.status(400).json({
        message: "Invalid payer",
        error: true,
        success: false,
      });
    }

    if (
      splits.some(
        (split) =>
          !group.members.some((member) => member.userId.equals(split.userId)),
      )
    ) {
      return response.status(400).json({
        message: "Invalid split users",
        error: true,
        success: false,
      });
    }

    const payload = {
      groupId: groupId,
      title: title,
      amount: amount,
      paidBy: paidBy,
      splitType: splitType,
      splits: splits,
    };

    const newExpense = new expenseModel(payload);
    await newExpense.save();

    // Update the balances
    group.members.find((member) => member.userId.equals(paidBy)).balance +=
      amount;
    splits.forEach((split) => {
      group.members.find((member) =>
        member.userId.equals(split.userId),
      ).balance -= split.share;
    });

    await group.save();

    return response.status(201).json({
      message: "Expense created successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

export const aiSplitController = async (request, response) => {
  try {
    const { groupId, description } = request.body;

    if (!description) {
      return response.status(400).json({
        message: "A description is required for ai split",
        error: true,
        success: false,
      });
    }

    const group = await groupModel
      .findById(groupId)
      .populate("members.userId", "name");

    const userList = group.members.map((member) => ({
      userId: member.userId._id,
      name: member.userId.name,
    }));

    if (
      !group ||
      !group.members.some((member) => member.userId.equals(request.userId))
    ) {
      return response.status(404).json({
        message: "Group not found",
        error: true,
        success: false,
      });
    }

    const prompt = `
You are an AI assistant for a bill-splitting application.

Your task is to read a natural language description of how expenses should be split among users, and convert it into a STRICT JSON response.

You are given:
1. A list of users with their IDs and names
2. A description of the split in plain English

----------------------------------------
USERS:
${JSON.stringify(userList)}
ID of current user: "${request.userId}"
----------------------------------------

DESCRIPTION:
"${description}"
----------------------------------------

INSTRUCTIONS:
- Parse the description carefully.
- Map each mentioned person to the correct userId using the USERS list.
- If a name does not match exactly, try to match intelligently (case-insensitive, partial match).
- Extract how much each person owes.
- If equal split is mentioned, divide equally.
- If percentages or specific amounts are mentioned, calculate correctly.
- Ensure total split is logically consistent.
- Find out who paid for the entire expense and assign that userId to paidBy.
- Incase it is not mentioned who paid, assume the current user paid.
- There can only be one user for paid for the entire expense, no partial payments.

OUTPUT FORMAT (STRICT):
- You MUST return ONLY valid JSON
- You MUST wrap it inside \`\`\`json ... \`\`\`
- Do NOT return anything outside the JSON block
- Do NOT add explanations except in message

FORMAT:
\`\`\`json
{
  "splits": [
    {
      "userId": String,
      "share": Number
    }
  ],
  "paidBy": String,
  "message": String
}
\`\`\`

ERROR HANDLING:
- If the description is unclear, invalid, or cannot be parsed:
  return:
\`\`\`json
{
  "splits": [],
  "paidBy": String,
  "message": String
}
\`\`\`

IMPORTANT RULES:
- Always return valid JSON
- Always use the exact userId from USERS
- Never invent userIds
- Never return text outside JSON block
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!match) {
      return response.status(500).json({
        message: "Error whilte parsing ai response",
        error: true,
        success: false,
      });
    }

    const jsonString = match[1];
    const parsed = JSON.parse(jsonString);
    const total = parsed.splits.reduce((sum, split) => sum + split.share, 0);

    return response.status(200).json({
      message: parsed.message,
      splits: parsed.splits,
      paidBy: parsed.paidBy,
      total: total,
      error: false,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};

export const paymentController = async (request, response) => {
  try {
    const { groupId, receiverId, amount } = request.body;

    if (!amount || amount <= 0) {
      return response.status(400).json({
        message: "Invalid amount",
        error: true,
        success: false,
      });
    }

    const sender = await userModel.findById(request.userId);
    const receiver = await userModel.findById(receiverId);

    if (!sender || !receiver) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const group = await groupModel.findById(groupId);

    if (!group.members.some((member) => member.userId.equals(sender._id))) {
      return response.status(404).json({
        message: "Group not found",
        error: true,
        success: false,
      });
    }

    if (!group.members.some((member) => member.userId.equals(receiver._id))) {
      return response.status(400).json({
        message: "Receiver must be in the group",
        error: true,
        success: false,
      });
    }

    // Update the balances
    group.members.find((member) => member.userId.equals(sender._id)).balance +=
      amount;
    group.members.find((member) =>
      member.userId.equals(receiver._id),
    ).balance -= amount;

    await group.save();

    return response.status(200).json({
      message: "Payment successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};
