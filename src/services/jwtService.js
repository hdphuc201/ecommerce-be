import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

import { env } from "~/config/environment";

// Chỉ gửi thông tin cần thiết vào payload để tăng cường bảo mật
const generateAccessToken = (user) => {
  // Gửi ID và quyền hạn (isAdmin) của người dùng thay vì toàn bộ object user
  return jwt.sign(
    { _id: user?._id, isAdmin: user?.isAdmin, jit: uuidv4() },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

const generateRefreshToken = (user) => {
  // Tạo Refresh Token với thông tin cần thiết
  return jwt.sign(
    { _id: user?._id, isAdmin: user?.isAdmin, jit: uuidv4() },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: "365d" }
  );
};

export const jwtService = {
  generateAccessToken,
  generateRefreshToken,
};
