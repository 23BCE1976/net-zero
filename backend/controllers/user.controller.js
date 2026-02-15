import bycryptjs from "bcryptjs";

import userModel from "../models/user.model.js";
import sendEmail from "../utils/sendEmail.js";
import verifyEmailTemplate from "../utils/verifyEmailTemplate.js";

export const registerController = async (request, response) => {
  try {
    const { name, email, password } = request.body;
    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Please fill the required details",
        error: true,
      });
    }

    const user = await userModel.findOne({ "email.value": email });

    if (user) {
      return response.status(400).json({
        message: "Email is already registered",
        error: true,
      });
    }

    const salt = await bycryptjs.genSalt(10);
    const hashPassword = await bycryptjs.hash(password, salt);

    const payload = {
      name: name,
      email: { value: email, verified: false },
      password: hashPassword,
    };

    const newUser = new userModel(payload);
    const savedUser = await newUser.save();
    const verifyLink = `${process.env.FRONTEND_URL}?code=${savedUser._id}`;

    sendEmail(
      email,
      "Verify Email",
      verifyEmailTemplate({ name: name, link: verifyLink }),
    );

    return response.status(200).json({
      messaeg: "Registered Successfully",
      error: false,
    });
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};
