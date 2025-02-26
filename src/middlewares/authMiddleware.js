import jwt from "jsonwebtoken";
import { env } from "~/config/environment";

// verify token
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    jwt.verify(token, env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        res.status(403).json({ message: "Token is not valid" });
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
    if (!user?.user?.isAdmin) {
      return res
        .status(403)
        .json({ message: "You are not allowed to delete other" });
    }
    next();
  } catch (error) {
    next(error);
  }
};
