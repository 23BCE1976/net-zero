import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import userModel from '../models/user.model.js';

dotenv.config();

const generateRefreshToken = async(userId) => {
  const token = jwt.sign({id : userId},process.env.SECRET_REFRESH_TOKEN,{
    expiresIn : '7d'
  })
  const save = await userModel.findByIdAndUpdate(userId,{
    refreshToken : token
  })
  return token;
}
export default generateRefreshToken;