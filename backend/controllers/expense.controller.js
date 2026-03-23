import groupModel from "../models/group.model.js";
import userModel from "../models/user.model.js";
import expenseModel from "../models/expense.model.js";

export const getAllController = async (request, response) => {
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
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
      success: false,
    });
  }
};
