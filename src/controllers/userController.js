import jwt from "jsonwebtoken";
import { env } from "~/config/environment";
import User from "~/models/userModel";
import { userService } from "~/services/userService";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "~/config/sendEmail";
import { OAuth2Client } from "google-auth-library";
import { jwtService } from "~/services/jwtService";

const registerUser = async (req, res, next) => {
  try {
    const { email, password, confirmPassword, code } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        error: true,
        message:
          "Email đã tồn tại, hãy đăng nhập Email này bằng Google hoặc vui lòng chọn email khác.",
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

    if (code && code === "") {
      return res.status(400).json({ message: "Vui lòng nhập mã xác nhận" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu không trùng khớp" });
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
      .status(200)
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
        .status(400)
        .json({ verify: false, message: "Mã xác thực đã hết hạn" });
    if (storedCode !== code)
      return res.status(400).json({ message: "Mã xác thực không đúng" });

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
    res.status(200).json({ verify: true, message: "Đăng ký thành công" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống, thử lại sau.", error });
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password, isActive } = req.body;

    if (isActive === false) {
      return res
        .status(400)
        .json({ success: false, message: "Tài khoản đã bị khóa" });
    }
    // Validate đầu vào
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Email không hợp lệ hoặc thiếu" });

    if (!password)
      return res.status(400).json({ message: "Password không được bỏ trống" });

    // Gọi service xử lý
    const response = await userService?.loginUser(req.body);

    if (!response.success) {
      return res.status(400).json(response);
    }

    // Nếu dùng cookie mode
    if (env.COOKIE_MODE) {
      const { checkUser } = response;

      const access_token = jwtService?.generateAccessToken(checkUser);
      const refresh_token = jwtService?.generateRefreshToken(checkUser);

      // Gán cookies
      res.cookie("refresh_token", refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

      res.cookie("access_token", access_token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

      // Xóa token trong response nếu dùng cookie
      delete response.token;
    } else {
      // xóa hoàn toàn token khỏi cookie nếu lưu ở local
      res.clearCookie("refresh_token");
      res.clearCookie("access_token");
    }

    return res.status(200).json({
      ...response,
      modeCookie: env.COOKIE_MODE,
    });
  } catch (error) {
    next(error);
  }
};

const loginGoogle = async (req, res, next) => {
  const { token } = req.body;
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

  try {
    if (!token) {
      return res.status(400).json({
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
        .status(400)
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

    return res.status(200).json({
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
    console.error("Lỗi loginGoogle:", error);
    return res.status(500).json({
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
      .status(200)
      .json({ success: true, message: "Đăng xuất thành công" }); // Thêm return ở đây
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  const { refreshToken } = req.body;
  try {
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
    return res.status(500).json({ success: false, message: error });
  }
};

const createUser = async (req, res, next) => {
  try {
    const { email, password, confirmPassword } = req.body;

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
      return res.status(400).json({ message: "Mật khẩu không trùng khớp" });
    }

    const newUser = await userService.createUser(req.body);
    if (!newUser) {
      return res
        .status(400)
        .json({ message: "Có lỗi xảy ra khi tạo người dùng" });
    }
    return res.status(200).json(newUser);
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
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });

    if (isAdmin === true) {
      const user = await User.findByIdAndUpdate(
        userId,
        { isActive },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        message: isActive
          ? "Mở khoá tài khoản thành công"
          : "Khoá tài khoản thành công",
        user,
      });
    }

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

    const user = await User.findById(id, "-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User không tồn tại" });
    }
    return res.status(200).json(user);
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

const getAddress = async (req, res, next) => {
  try {
    const id = req.user._id;

    if (!id) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await User.findById(id);
    const listAddress = user.address.map((item) => item);
    if (!listAddress.length) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa cập nhật địa chỉ" });
    }

    return res.status(200).json(listAddress);
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
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const validators = {
      houseNumber: (val) => !!val,
      district: (val) => !!val,
      city: (val) => !!val,
    };

    for (const field in validators) {
      if (!validators[field](req.body[field])) {
        return res
          .status(400)
          .json({ message: `${field} không hợp lệ hoặc thiếu` });
      }
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
      return res.status(200).json({
        success: true,
        message: "Tạo địa chỉ thành công",
        userUpdate,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
      });
    }
  } catch (error) {
    console.error("Lỗi createAddress:", error);
    next(error);
  }
};

const removeAddress = async (req, res, next) => {
  try {
    const id = req.user._id;
    const { id: addressId } = req.query;

    if (!id) {
      return res
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    const listAddress = user.address?.filter(
      (item) => item._id.toString() !== addressId
    );

    // Nếu không tìm thấy địa chỉ nào cần xóa
    if (user.address.length === listAddress.length) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy địa chỉ để xóa" });
    }
    // Cập nhật lại danh sách địa chỉ sau khi xóa
    user.address = listAddress;

    // Lưu lại người dùng với danh sách địa chỉ mới
    await user.save();

    return res
      .status(200)
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
        .status(401)
        .json({ success: false, message: "Chưa đăng nhập" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    let itemAddress = user.address?.findIndex(
      (item) => item._id.toString() === addressId
    );
    if (itemAddress === -1) {
      return res.status(404).json({ message: "Địa chỉ không tồn tại" });
    }
    const updateAddress = {};
    if (houseNumber) updateAddress.houseNumber = houseNumber;
    if (district) updateAddress.district = district;
    if (city) updateAddress.city = city;
    if (defaultAddress) updateAddress.defaultAddress = defaultAddress;

    user.address[itemAddress] = updateAddress;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

export const userController = {
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
};
