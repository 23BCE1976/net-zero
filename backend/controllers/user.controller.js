import userModel from "../models/user.model.js";
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import generateRefreshToken from "../utils/generateRefereshToken.js";
import generateAccessToken from "../utils/generateAccessToken.js";

export const loginController = async(request, response) => {
  try {
    const {email, password} = request.body;
    if(!email || !password){
      return response.status(401).json({
        message : "Please fill in the required details",
        error : true
      })
    }

    const user = await userModel.findOne({"email.value" : email});

    if(!user){
      return response.status(401).json({
        message : "Please sign in to continue",
        error : true
      })
    }
    
    const checkPassword = await bcryptjs.compare(password, user.password);

    if(!checkPassword){
      return response.status(400).json({
        message : "Please enter the correct password or email",
        error : true
      })
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id);

    const cookieSettings = {
      httpOnly  : true,
      sameSite : "None"
    }

    response.cookie("accessToken",accessToken,cookieSettings);
    response.cookie("refreshToken",refreshToken,cookieSettings);

    return response.status(200).json({
      message : "User is logged in successfully",
      error : false,
      success : true
    })
  } catch (error) {
    return response.status(500).json({
      message : "Internal Server Error",
      error : true
    })
  }
}

