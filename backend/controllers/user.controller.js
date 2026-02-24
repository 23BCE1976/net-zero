import bcryptjs from "bcryptjs";
import crypto from "crypto";

import userModel from "../models/user.model.js";

import generateRefreshToken from "../utils/generateRefereshToken.js";
import generateAccessToken from "../utils/generateAccessToken.js";
import sendEmail from "../utils/sendEmail.js";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";
import resetPwdTemplate from "../utils/resetPwdTemplate.js";
import generateOTP from "../utils/generateOTP.js";

export const loginController = async (request, response) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(401).json({
        message: "Please fill in the required details",
        error: true,
        success: false,
      });
    }

    const user = await userModel.findOne({ "email.value": email });

    if (!user) {
      return response.status(401).json({
        message: "Please sign in to continue",
        error: true,
        success: false,
      });
    }

    const checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return response.status(400).json({
        message: "Please enter the correct password or email",
        error: true,
        success: false,
      });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    const cookieSettings = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.cookie("accessToken", accessToken, cookieSettings);
    response.cookie("refreshToken", refreshToken, cookieSettings);

    return response.status(200).json({
      message: "User is logged in successfully",
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

export const registerController = async (request, response) => {
  try {
    const { name, email, password } = request.body;
    if (!name || !email || !password) {
      return response.status(409).json({
        message: "Please fill the required details",
        error: true,
        success: false,
      });
    }

    const user = await userModel.findOne({ "email.value": email });

    if (user) {
      return response.status(400).json({
        message: "Email is already registered",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);

    const emailVerificationCode = crypto.randomBytes(32).toString("hex");
    const emailVerificationExpiry = Date.now() + 1000 * 60 * 60 * 24; // 1 day

    const payload = {
      name: name,
      email: {
        value: email,
        verified: false,
        verificationCode: emailVerificationCode,
        verificationExpiry: emailVerificationExpiry,
      },
      password: hashPassword,
    };

    const newUser = new userModel(payload);
    await newUser.save();
    const verifyLink = `${process.env.FRONTEND_URL}/verify-email?code=${emailVerificationCode}`;

    sendEmail({
      to: email,
      subject: "Verify Email",
      html: verifyEmailTemplate({ name: name, link: verifyLink }),
    });

    return response.status(201).json({
      message: "Registered Successfully",
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

export const verifyEmailController = async (request, response) => {
  try {
    const { verificationCode } = request.body;
    const user = await userModel.findOne({
      "email.verificationCode": verificationCode,
    });

    if (!user) {
      return response.status(404).json({
        message: "Invalid token, failed to verify",
        error: true,
        success: false,
      });
    }

    if (user.email.verificationExpiry < Date.now()) {
      return response.status(400).json({
        message: "Expired token, failed to verify",
        error: true,
        success: false,
      });
    }

    user.email.verified = true;
    user.email.verificationCode = undefined;
    user.email.verificationExpiry = undefined;

    await user.save();

    return response.status(200).json({
      message: "Email verified successfully",
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

export const logoutController = async (request, response) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    };

    response.clearCookie("accessToken", cookieOptions);
    response.clearCookie("refreshToken", cookieOptions);

    await userModel.findByIdAndUpdate(request.userId, {
      refreshToken: null,
    });

    return response.status(200).json({
      message: "Logged out successfully",
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

export const updateUserController = async (request, response) => {
  try {
    const { name, email, password, avatarUrl, mobile, upiId } = request.body;

    const user = await userModel.findById(request.userId);
    if (user) {
      return response.status(409).json({
        message: "This email is already in use",
        error: true,
        success: false,
      });
    }

    if (email) {
      const emailVerificationCode = crypto.randomBytes(32).toString("hex");
      const emailVerificationExpiry = Date.now() + 1000 * 60 * 60 * 24; // 1 day
      user.email = {
        value: email,
        verified: false,
        verificationCode: emailVerificationCode,
        verificationExpiry: emailVerificationExpiry,
      };
    }

    if (password) {
      const salt = await bcryptjs.genSalt(10);
      const hashPassword = await bcryptjs.hash(password, salt);
      user.password = hashPassword;
    }

    if (name) user.name = name;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (mobile) user.mobile = mobile;
    if (upiId) user.upiId = upiId;

    await user.save();

    return response.status(200).json({
      message: "User updated successfully",
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

export const forgotPasswordController = async (request, response) => {
  try {
    const { email } = request.body;

    const user = await userModel.findOne({ "email.value": email });

    if (!user) {
      return response.status(400).json({
        message: "The User is not registered with us",
        error: true,
        success: false,
      });
    }

    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    user.otp = {
      value: otp,
      verificationExpiry: expiryTime,
      verified: false,
    };
    await user.save();

    sendEmail({
      to: email,
      subject: "Reset Password OTP",
      html: resetPwdTemplate({
        name: user.name,
        otp: otp,
      }),
    });

    return response.status(200).json({
      message: "Please check your email",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      error: error.message,
      success: false,
      error: true,
    });
  }
};

export const verifyForgotPWDController = async (request, response) => {
  try {
    const { email, otp } = request.body;

    const user = await userModel.findOne({ "email.value": email });

    if (!user || !user.otp?.value || !otp) {
      return response.status(400).json({
        message: "User doesn't exist or OTP is not present",
        success: false,
        error: true,
      });
    }
    if (otp !== user.otp.value) {
      return response.status(400).json({
        message: "OTP entered is wrong",
        success: false,
        error: true,
      });
    }

    if (user.otp.verificationExpiry < Date.now()) {
      return response.status(400).json({
        message: "OTP has expired please create new OTP",
        success: false,
        error: true,
      });
    }

    user.otp.verified = true;
    await user.save();

    return response.status(200).json({
      message: "Can change your password",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: true,
    });
  }
};

export const resetPWDController = async (request, response) => {
  try {
    const { email, newPassword, confirmPassword } = request.body;

    if (!email || !newPassword || !confirmPassword) {
      return response.status(400).json({
        message: "Please provide all the necessary details",
        success: false,
        error: true,
      });
    }
    const user = await userModel.findOne({ "email.value": email });
    if (!user) {
      return response.status(400).json({
        message: "Email invalid",
        success: false,
        error: true,
      });
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "Confirm password and password is wrong",
        success: false,
        error: true,
      });
    }

    if (!user.otp?.verified) {
      return response.status(403).json({
        message: "Unauthorized",
        success: false,
        error: true,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(newPassword, salt);

    user.password = hashPassword;
    user.otp = undefined;
    await user.save();

    return response.status(200).json({
      message: "Password is successfully changed",
      success: true,
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: true,
    });
  }
};
