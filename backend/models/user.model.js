import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: {
      value: {
        type: String,
        required: [true, "Please enter your email"],
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },
    unique: true,
  },
  avatarUrl: {
    type: String,
    default: "https://assets.leetcode.com/users/default_avatar.jpg",
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
  },
  refreshToken: {
    type: String,
  },
  mobile: {
    type: Number,
  },
  upiId: {
    type: String,
  },
  otp: {
    type: {
      value: {
        type: Number,
      },
      timeStamp: {
        type: Date,
      },
    },
    validate: {
      validator: (otp) => {
        if (otp == null) return true;
        return otp.value != null && otp.timeStamp != null;
      },
    },
  },
});

const userModel = mongoose.model("user", userSchema);

export default userModel;
