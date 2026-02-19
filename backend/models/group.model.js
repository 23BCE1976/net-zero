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
      ref: "user",
      required: [true, "A group admin is required"],
    },
    members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
        },
      ],
      default: [],
    },
    inviteLink: {
      type: String,
      required: [true, "An invite link is required"],
    },
  },
  {
    timestamps: true,
  },
);

const groupModel = mongoose.model("group", groupSchema);

export default groupModel;
