import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config();

const generateAccessToken = (userId) => {
  const token = jwt.sign({id : userId}, process.env.SECRET_ACCESS_TOKEN,{
    expiresIn : '5h'
  })
  return token;
}
export default generateAccessToken;