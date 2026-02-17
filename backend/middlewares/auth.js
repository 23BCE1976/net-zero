import jwt from "jsonwebtoken";

const auth = async (request, response, next) => {
  try {
    const token = request.cookies.accessToken;

    if (!token) {
      return response.status(404).json({
        message: "Token not found",
        error: true,
      });
    }

    try {
      const decode = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);

      request.userId = decode.id;
      next();
    } catch (e) {
      return response.status(401).json({
        message: "Invalid or expired token",
        error: true,
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: "Internal Server Error",
      error: true,
    });
  }
};

export default auth;
