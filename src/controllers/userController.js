import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

import { env } from "~/config/environment";
import {
  sendOTPCodeEmailChangePassword,
  sendVerificationEmail,
} from "~/config/sendEmail";
import Order from "~/models/orderModel";
import User from "~/models/userModel";
import { jwtService } from "~/services/jwtService";
import { userService } from "~/services/userService";

import axios from 'axios';


const changePassword = async (req, res) => {
  const { email, code } = req.body;
  const existUser = await User.findOne({ email });
  if (!existUser) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Email không tồn tại" });
  }

  if (!code) {
    // Tạo mã xác thực
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const redisClient = req.redisClient;
    await redisClient.setEx(`verify:${email}`, 600, verificationCode);
    // Gửi email
    await sendOTPCodeEmailChangePassword(email, verificationCode);
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Mã xác thực đã được gửi đến email" });
  } else {
    const redisClient = req.redisClient;
    const storedCode = await redisClient.get(`verify:${email}`);
    if (!storedCode)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ verify: false, message: "Mã xác thực đã hết hạn" });
    if (storedCode !== code)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Mã xác thực không đúng" });
    await redisClient.del(`verify:${email}`);
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Xác thực thành công" });
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { email, password, confirmPassword, code } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: true,
        message:
          "Email đã tồn tại, hãy đăng nhập Email này bằng Google hoặc vui lòng chọn email khác.",
      });
    }

    if (code && code === "") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Vui lòng nhập mã xác nhận" });
    }
    if (password !== confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Mật khẩu không trùng khớp" });
    }

    // Tạo mã xác thực
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const redisClient = req.redisClient;
    await redisClient.setEx(`verify:${email}`, 600, verificationCode);
    // Gửi email
    await sendVerificationEmail(email, verificationCode);
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Mã xác thực đã được gửi đến email" });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res) => {
  const { email, code, password, name, isAdmin } = req.body;

  const redisClient = req.redisClient;
  // Lấy mã từ Redis
  try {
    const storedCode = await redisClient.get(`verify:${email}`);
    if (!storedCode)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ verify: false, message: "Mã xác thực đã hết hạn" });
    if (storedCode !== code)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Mã xác thực không đúng" });

    // Mã đúng => Tạo tài khoản
    const hash = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hash,
      isAdmin,
      isLogin: true,
    });
    await newUser.save();
    // Xóa mã khỏi Redis
    await redisClient.del(`verify:${email}`);
    res
      .status(StatusCodes.OK)
      .json({ verify: true, message: "Đăng ký thành công" });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Lỗi hệ thống, thử lại sau.", error });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { isActive, password } = req.body;

    if (isActive === false) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ success: false, message: "Tài khoản đã bị khóa" });
    }

    if (!password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Mật khẩu không được bỏ trống" });
    }

    // Gọi service xử lý
    const response = await userService?.loginUser(req.body);

    if (!response.success)
      return res.status(StatusCodes.BAD_REQUEST).json(response);
    const { token, ...rest } = response;

    // nếu lưu ở cookie thì response sẽ không lấy token
    const newResponse = env.COOKIE_MODE ? rest : response;
    // Nếu dùng cookie mode
    if (env.COOKIE_MODE) {
      // Gán cookies
      res.cookie("refresh_token", token.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

      res.cookie("access_token", token.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });
    } else {
      // xóa hoàn toàn token khỏi cookie nếu lưu ở local
      res.clearCookie("refresh_token");
      res.clearCookie("access_token");
    }
    return res.status(StatusCodes.OK).json(newResponse);
  } catch (error) {
    next(error);
  }
};

const loginGoogle = async (req, res, next) => {
  const { token } = req.body;
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  try {
    if (!token) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Token không hợp lệ",
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const { sub, name, email, picture } = ticket.getPayload();
    let user = await User.findOne({ email });

    if (user && user.isActive === false) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Tài khoản đã bị khóa" });
    }

    if (!user) {
      user = await User.create({
        googleId: sub,
        name,
        email,
        isLogin: true,
        avatar: picture,
      });
    }

    const access_token = jwtService.generateAccessToken(user);
    const refresh_token = jwtService.generateRefreshToken(user);

    if (env.COOKIE_MODE) {
      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 15 * 60 * 1000, // 15 phút
      });
    } else {
      res.clearCookie("refresh_token");
      res.clearCookie("access_token");
    }

    user.isLogin = true;
    await user.save();

    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Đăng nhập thành công",
      email: user?.email,
      name: user?.name,
      isAdmin: user?.isAdmin,
      isLogin: true,
      avatar: user?.avatar || picture,
      _id: user?._id,
      ...(env.COOKIE_MODE
        ? {}
        : {
            token: {
              access_token,
              refresh_token,
            },
          }),
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error?.message || "Lỗi server",
    });
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const redisClient = req.redisClient; // Lấy redis từ middleware
    await redisClient.set(
      `TOKEN_BLACKLIST_${req.user?._id}_${req.user?.jit}`,
      "true",
      {
        EX: 60 * 60 * 24,
      }
    );
    res.clearCookie("refresh_token");
    res.clearCookie("access_token");
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Đăng xuất thành công" }); // Thêm return ở đây
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  try {
    if (!refreshToken) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Không có refresh token" });
    }

    // Kiểm tra refresh token có hợp lệ không
    jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ success: false, message: "Refresh token không hợp lệ" });
      }
      const newAccessToken = jwt.sign(
        { user: user.user },
        env.ACCESS_TOKEN_SECRET,

        { expiresIn: "3d" }
      );

      return res.json({ success: true, access_token: newAccessToken });
    });
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error });
  }
};

const createUser = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: true,
        message: "Email đã tồn tại. Vui lòng chọn email khác.",
      });
    }

    if (password !== confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Mật khẩu không trùng khớp" });
    }

    const newUser = await userService.createUser(req.body);
    if (!newUser) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Có lỗi xảy ra khi tạo người dùng" });
    }
    return res.status(StatusCodes.OK).json(newUser);
  } catch (error) {
    next(error);
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const { password, email } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const exsitUser = await User.findOne({ email });
    await User.findByIdAndUpdate(exsitUser._id, { password: hash });
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Mật khẩu đã được đổi" });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    // update sử dụng cho user và admin
    // nếu req?.body (từ admin) không có thì lấy user id (từ user)
    const { _id, isActive, isAdmin, userId } = req.body;
    const id = _id ? _id : req?.user._id;
    if (!id)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Bắt buộc phải có ID" });

    if (isAdmin === true) {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      );
      return res.status(StatusCodes.OK).json({
        success: true,
        message: isActive
          ? "Mở khoá tài khoản thành công"
          : "Khoá tài khoản thành công",
        user,
      });
    }

    const result = await userService.updateUser(id, req.body);
    if (!result.success)
      return res.status(StatusCodes.BAD_REQUEST).json(result);
    return res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Bắt buộc phải có ID" });

    const user = await User.findById(id, "-password");
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User không tồn tại" });
    }
    return res.status(StatusCodes.OK).json(user);
  } catch (error) {
    next(error);
  }
};

const getAllUser = async (req, res, next) => {
  const { orderCount, isLogin, isActive } = req.query;

  try {
    const filterObj = { isAdmin: false };
    if (isLogin && isLogin !== "all") filterObj.isLogin = isLogin;
    if (isActive && isActive !== "all") filterObj.isActive = isActive;

    // Lấy toàn bộ order và tính số đơn hàng theo user
    const listOrder = await Order.find({}, "userId");
    const countMap = listOrder.reduce((acc, order) => {
      const uid = String(order.userId);
      acc[uid] = (acc[uid] || 0) + 1;
      return acc;
    }, {});

    const entries = Object.entries(countMap); // [ [userId, count], ... ]
    if (entries.length === 0) {
      return res.status(StatusCodes.OK).json([]); // Không có đơn hàng nào
    }

    // Tìm số đơn hàng nhiều nhất và ít nhất
    const counts = entries.map(([_, count]) => count);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);

    // Lọc userId tương ứng
    let targetUserIds = [];

    if (orderCount === "max") {
      targetUserIds = entries
        .filter(([_, count]) => count === maxCount)
        .map(([userId]) => userId);
    } else if (orderCount === "min") {
      targetUserIds = entries
        .filter(([_, count]) => count === minCount)
        .map(([userId]) => userId);
    } else if (orderCount === "all") {
      targetUserIds = Object.keys(countMap);
    }

    if (targetUserIds.length > 0) {
      filterObj._id = { $in: targetUserIds };
    }

    const users = await User.find(filterObj, "-password");
    return res.status(StatusCodes.OK).json(users);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Bắt buộc phải có ID" });
    }

    const isArray = Array.isArray(id) ? id : [id];
    const result = await User.deleteMany({ _id: { $in: isArray } });
    if (result.deletedCount > 0) {
      return res.status(StatusCodes.OK).json({
        ...result,
        success: true,
        message: `Đã xóa ${result.deletedCount} user `,
      });
    } else {
      return res.status(StatusCodes.BAD_REQUEST).json({
        result,
        success: false,
        message: "Không tìm thấy user.",
      });
    }
  } catch (error) {
    next(error);
  }
};

const getAddress = async (req, res, next) => {
  try {
    const id = req.user._id;

    if (!id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await User.findById(id);
    const listAddress = user.address.map((item) => item);
    if (!listAddress.length) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Chưa cập nhật địa chỉ" });
    }

    return res.status(StatusCodes.OK).json(listAddress);
  } catch (error) {
    next(error);
  }
};

const createAddress = async (req, res, next) => {
  try {
    const id = req.user?._id;
    const { houseNumber, district, city, defaultAddress } = req.body;

    if (!id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    if (defaultAddress) {
      await User.findByIdAndUpdate(id, {
        $set: { "address.$[].defaultAddress": false }, // Đặt tất cả defaultAddress = false
      });
    }

    const userUpdate = await User.findByIdAndUpdate(
      id,
      {
        $push: {
          address: { houseNumber, district, city, defaultAddress },
        },
      },
      { new: true }
    );

    if (userUpdate) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Tạo địa chỉ thành công",
        userUpdate,
      });
    } else {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }
  } catch (error) {
    next(error);
  }
};

const removeAddress = async (req, res, next) => {
  try {
    const id = req.user._id;
    const { id: addressId } = req.query;

    if (!id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    const listAddress = user.address?.filter(
      (item) => item._id.toString() !== addressId
    );

    // Nếu không tìm thấy địa chỉ nào cần xóa
    if (user.address.length === listAddress.length) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Không tìm thấy địa chỉ để xóa" });
    }
    // Cập nhật lại danh sách địa chỉ sau khi xóa
    user.address = listAddress;

    // Lưu lại người dùng với danh sách địa chỉ mới
    await user.save();

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Xóa thành công", listAddress });
  } catch (error) {
    next(error);
  }
};

const updateAddress = async (req, res, next) => {
  try {
    const id = req?.user?._id;
    const { houseNumber, district, city, defaultAddress, addressId } = req.body;

    if (!id) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    let itemAddress = user.address?.findIndex(
      (item) => item._id.toString() === addressId
    );
    if (itemAddress === -1) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Địa chỉ không tồn tại" });
    }
    const updateAddress = {};
    if (houseNumber) updateAddress.houseNumber = houseNumber;
    if (district) updateAddress.district = district;
    if (city) updateAddress.city = city;
    if (defaultAddress) updateAddress.defaultAddress = defaultAddress;

    // Nếu defaultAddress bằng true thì những address còn lại set default là false
    user.address.forEach((item) => {
      if (defaultAddress && defaultAddress === true) {
        return (item.defaultAddress = false);
      }
    });

    user.address[itemAddress] = updateAddress;
    await user.save();

    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

const avatarProxyRoute = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: "Thiếu URL ảnh" });
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });

    const contentType = response.headers["content-type"];
    res.set("Content-Type", contentType);
    return res.status(StatusCodes.OK).send(response.data);
  } catch (error) {
    console.error("Lỗi tải ảnh proxy:", error.message);
    return next(error);
  }
};

export const userController = {
  changePassword,
  updateUserPassword,
  registerUser,
  verifyEmail,
  loginUser,
  loginGoogle,
  logoutUser,
  refreshToken,
  updateUser,
  getDetail,
  createUser,
  getAllUser,
  deleteUser,
  getAddress,
  createAddress,
  removeAddress,
  updateAddress,
  avatarProxyRoute,
};
