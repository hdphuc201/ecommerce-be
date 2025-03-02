import jwt from "jsonwebtoken";
import { env } from "~/config/environment";
import User from "~/models/userModel";
import { userService } from "~/services/userService";


const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: "Email đã tồn tại. Vui lòng chọn email khác.",
      });
    }

    const validators = {
      name: (val) => val,
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

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: "confirmPassword không trùng khớp" });
    }

    const newUser = await userService.registerUser(req.body);

    return res.status(200).json(newUser); // Sử dụng return ở đây
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

    if (!response.success) {
      return res.status(400).json(newResponse); // Thêm return ở đây
    }
    return res.status(200).json(newResponse); // Thêm return ở đây
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
      if (err) {
        return res
          .status(403)
          .json({ success: false, message: "Refresh token không hợp lệ" }); // Dùng return ở đây
      }
      const newAccessToken = jwt.sign(
        { user: user.user },
        env.ACCESS_TOKEN_SECRET,

        { expiresIn: "3d" }
      );

      return res.json({ success: true, access_token: newAccessToken }); // Dùng return ở đây
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error }); // Dùng return ở đây
  }
};

const createUser = async (req, res, next) => {
  try {
    const {
      avatar,
      name,
      email,
      phone,
      password,
      confirmPassword,
      isAdmin,
      address,
    } = req.body;

    const existingUser = await User.findOne({ email });
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
        .json({ message: "confirmPassword không trùng khớp" });
    }

    const newUser = await userService.createUser(req.body);

    return res.status(200).json(newUser); // Sử dụng return ở đây
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    // update sử dụng cho user và admin
    // nếu req?.body (từ admin) không có thì lấy user id (từ user)
    const { _id } = req?.body ?? {};
    const id = req?.body ? _id : req.user?._id;

    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });
    const result = await userService.updateUser(id, req.body);
    if (!result.success) return res.status(400).json(result);
    return res.status(200).json(result);
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

const getAllUser = async (req, res, next) => {
  try {
    const users = await User.find({}, "-password"); // không lấy password
    return res.status(200).json(users); // Đảm bảo phản hồi này chỉ được gọi 1 lần
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ message: "Bắt buộc phải có ID" });
    }

    const isArray = Array.isArray(id) ? id : [id];
    const result = await User.deleteMany({ _id: { $in: isArray } });
    if (result.deletedCount > 0) {
      return res.status(200).json({
        ...result,
        success: true,
        message: `Đã xóa ${result.deletedCount} user `,
      });
    } else {
      return res.status(400).json({
        result,
        success: false,
        message: "Không tìm thấy user.",
      });
    }
  } catch (error) {
    next(error);
  }
};

const deleteAllUsers = async (req, res, next) => {
  try {
    const { passwordAdmin } = req.body;
    if (!passwordAdmin) {
      return res.status(400).json({ message: "Password admin là bắt buộc" });
    }

    const result = await userService.deleteAllUsers(passwordAdmin);
    if (!result.success) return res.status(400).json(result);

    // Thêm một phản hồi thành công (nếu cần) hoặc điều gì đó tương tự ở đây
  } catch (error) {
    next(error);
  }
};

export const userController = {
  registerUser,
  loginUser,
  refreshToken,
  updateUser,
  getDetail,
  createUser,
  getAllUser,
  deleteUser,
  deleteAllUsers,
};
