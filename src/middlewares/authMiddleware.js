import jwt from "jsonwebtoken";
import { env } from "~/config/environment";
import { jwtService } from "~/services/jwtService";

// verify token
// trả về lỗi token hết hạn và để FE xử lý nếu lưu token vào local storage
// còn lưu vào cookie thì không cần trả về lỗi -> BE xử lý luôn
// export const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.headers.authorization?.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ message: "Unauthorized" }); // Thêm return
//     }
//     jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err, user) => {
//       if (err) {
//         return res.status(403).json({ message: "Token is not valid" }); // Thêm return
//       }
//       req.user = user;
//       next();
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    console.log("Cookies Header:", req.headers.cookie);
    console.log("Token được lấy từ cookie:", token);

    if (!token) {
      res.status(401).json({ message: "Unauthorized - No tokens found" });
      return;
    }

    jwt.verify(token, env.ACCESS_TOKEN_SECRET, async (err, user) => {
      if (err) {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) {
          return res
            .status(401)
            .json({ message: "Unauthorized - No refresh tokens found" });
        }

        // Verify refresh token
        jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, (err, user) => {
          if (err) {
            return res.status(403).json({
              message: "Refresh token is not valid",
              expired: true,
            });
          }

          // Generate new access token
          const newAccessToken = jwtService.generateAccessToken(user);

          // Set new access token in response
          res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: true, // Chỉ bật Secure nếu chạy trên HTTPS
            sameSite: "None",
          });

          req.user = user;
          next();
        });
        return;
      }
      const redisClient = req.redisClient; // Lấy redis từ middleware
      const isBlacklisted = await redisClient.get(
        `TOKEN_BLACKLIST_${user?._id}_${user.jit}`
      );
      if (isBlacklisted) {
        return res.status(401).json({ message: "Token revoked" });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const { user } = req;
    if (!user?.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete other" }); // Thêm return
    }
    next();
  } catch (error) {
    next(error);
  }
};
