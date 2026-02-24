import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: {
        value: {
          type: String,
          required: [true, "Please enter your email"],
          lowercase: true,
          trim: true,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        verificationCode: {
          type: String,
        },
        verificationExpiry: {
          type: Date,
        },
      },
      validate: {
        validator: function (email) {
          if (
            email.verificationCode == null &&
            email.verificationExpiry == null
          ) {
            return true;
          }
          return (
            email.verificationCode != null && email.verificationExpiry != null
          );
        },
      },
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
      type: String,
    },
    upiId: {
      type: String,
    },
    otp: {
      type: {
        value: {
          type: Number,
        },
        verificationExpiry: {
          type: Date,
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
      validate: {
        validator: function (otp) {
          if (otp == null) return true;
          return otp.value != null && otp.verificationExpiry != null;
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index({ "email.value": 1 }, { unique: true });

const userModel = mongoose.model("User", userSchema);

export default userModel;
