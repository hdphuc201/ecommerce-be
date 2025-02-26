import jwt from "jsonwebtoken";
import { env } from "~/config/environment";
import userModel from "~/models/UserModel";
import { userService } from "~/services/userService";
const { StatusCodes } = require("http-status-codes");

const registerUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, isAdmin } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: "Email đã tồn tại. Vui lòng chọn email khác.",
      });
    }
    const validators = {
      name: (val) => val,
      email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      phone: (val) => /^\d{10}$/.test(val),
      password: (val) => val,
    };

    for (const filed in validators) {
      if (!validators[filed](req.body[filed])) {
        return res
          .status(400)
          .json({ message: `${filed} không hợp lệ hoặc thiếu` });
      }
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "ConfirmPassword không trùng khớp" });
    }

    const newUser = await userService.registerUser(req.body);

    res.status(StatusCodes.CREATED).json(newUser);
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const validators = {
      email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      password: (val) => val,
    };

    for (const filed in validators) {
      if (!validators[filed](req.body[filed])) {
        return res
          .status(400)
          .json({ message: `${filed} không hợp lệ hoặc thiếu` });
      }
    }
    const response = await userService.loginUser(req.body);
    const { refresh_token, ...newResponse } = response;
    res.cookie("refresh_token", refresh_token, {
      httpOnly: true, // Ngăn JavaScript truy cập cookie
      secure: true, // Chỉ gửi qua HTTPS
      sameSite: "strict", // Bảo vệ chống CSRF
    });
    if (!response.success) return res.status(400).json(newResponse);
    return res.status(200).json(newResponse);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const form = req.body;
    const id = req.user.user._id;
    console.log("form", form);
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });
    const result = await userService.updateUser(id, form);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });

    const result = await userService.deleteUser(id);
    if (!result.success) return res.status(400).json(result);
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });

    const result = await userService.getDetail(id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req?.cookies?.refresh_token;

    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Không có refresh token" });
    }

    // Kiểm tra refresh token có hợp lệ không
    jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err)
        return res
          .status(403)
          .json({ success: false, message: "Refresh token không hợp lệ" });
      const newAccessToken = jwt.sign(
        { user: user.user },
        env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "15m",
        }
      );

      res.json({ success: true, access_token: newAccessToken });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
};

export const userController = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getDetail,
  refreshToken,
};
