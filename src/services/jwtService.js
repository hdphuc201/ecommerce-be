import jwt from "jsonwebtoken";
import { env } from "~/config/environment";

const generateAccessToken = (user) => {
  return jwt.sign(
    { user },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: "3h" } // Token hết hạn sau 1 giờ
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { user },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: "365d" } // Token hết hạn sau 365 ngày
  );
};

// const refreshToken = async (refreshToken) => {
//   try {
//     jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, (err, user) => {
//       if (err)
//         return res
//           .status(403)
//           .json({ success: false, message: "Refresh token không hợp lệ" });

//       // Nếu hợp lệ, tạo access token mới
//       const newAccessToken = jwt.sign(
//         { id: user.id },
//         process.env.ACCESS_SECRET,
//         {
//           expiresIn: "15m", // Access token có thời hạn 15 phút
//         }
//       );

//       res.json({ success: true, access_token: newAccessToken });
//     });
//     const { user: payload } = userDecoded;
//     const new_access_token = generateAccessToken(payload);
//     return { success: true, access_token: newAccessToken };
//   } catch (error) {
//     throw new Error();
//   }
// };

export const jwtService = {
  generateAccessToken,
  generateRefreshToken,
  // refreshToken,
};
