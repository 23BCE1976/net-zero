import mongoose from "mongoose";

const splitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  share: {
    type: Number,
    required: true,
  },
});

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: [true, "Expense must belong to a group"],
    },
    amount: {
      type: Number,
      required: [true, "Expense must have a total amount"],
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A user is required who initially paid"],
    },
    splitType: {
      type: String,
      enum: {
        values: ["exact", "equal", "percentage", "ratio", "ai"],
        message: "Invalid split type",
      },
      default: "exact",
    },
    splits: [splitSchema],
  },
  {
    timestamps: true,
  },
);

const expenseModel = mongoose.model("Expense", expenseSchema);

export default expenseModel;
