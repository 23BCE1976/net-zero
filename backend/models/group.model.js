import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Untitled",
    },
    type: {
      type: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A group admin is required"],
    },
    members: {
      type: [
        {
          userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          balance: {
            type: Number,
            default: 0, // +ve = should receive, -ve = owes
          },
        },
      ],
      default: [],
    },
    joinCode: {
      type: String,
      required: [true, "An join code is required"],
    },
  },
  {
    timestamps: true,
  },
);

groupSchema.index({ members: 1 });

const groupModel = mongoose.model("Group", groupSchema);

export default groupModel;
