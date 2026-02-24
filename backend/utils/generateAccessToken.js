import jwt from "jsonwebtoken";

const generateAccessToken = (userId) => {
  const token = jwt.sign({ id: userId }, process.env.SECRET_ACCESS_TOKEN, {
    expiresIn: "5h",
  });
  return token;
};
export default generateAccessToken;
