import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

import { env } from "~/config/environment";
import { jwtService } from "~/services/jwtService";

// verify token
// trả về lỗi token hết hạn và để FE xử lý nếu lưu token vào local storage
// còn lưu vào cookie thì không cần trả về lỗi -> BE xử lý luôn
export const authMiddleware = async (req, res, next) => {
  try {
    const token = env.COOKIE_MODE
      ? req.cookies?.access_token
      : req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
    }

    jwt.verify(token, env.ACCESS_TOKEN_SECRET, async (err, user) => {
      if (err && !env.COOKIE_MODE) {
        return res.status(StatusCodes.FORBIDDEN).json({ message: "Token is not valid" });
      }

      if (err && env.COOKIE_MODE) {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ message: "Unauthorized - No refresh tokens found" });
        }

        jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, (err, user) => {
          if (err) {
            return res.status(StatusCodes.FORBIDDEN).json({
              message: "Refresh token is not valid",
              expired: true,
            });
          }

          const newAccessToken = jwtService?.generateAccessToken(user);

          res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
          });

          req.user = user;
          next();
        });
        return;
      }

      // nếu lưu token vào cookie
      if (env.COOKIE_MODE) {
        const redisClient = req.redisClient;
        const isBlacklisted = await redisClient.get(
          `TOKEN_BLACKLIST_${user?._id}_${user.jit}`
        );
        if (isBlacklisted) {
          return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Token revoked" });
        }
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
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "You are not allowed to delete other" }); // Thêm return
    }
    next();
  } catch (error) {
    next(error);
  }
};
