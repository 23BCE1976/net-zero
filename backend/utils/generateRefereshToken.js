import jwt from "jsonwebtoken";

import userModel from "../models/user.model.js";

const generateRefreshToken = async (userId) => {
  const token = jwt.sign({ id: userId }, process.env.SECRET_REFRESH_TOKEN, {
    expiresIn: "7d",
  });
  await userModel.findByIdAndUpdate(userId, {
    refreshToken: token,
  });
  return token;
};
export default generateRefreshToken;
