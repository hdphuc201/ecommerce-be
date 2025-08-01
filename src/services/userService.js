import bcrypt from "bcrypt";

import User from "~/models/userModel";

import { jwtService } from "./jwtService";

const registerUser = async (newUser) => {
  try {
    const { name, email, password, isAdmin } = newUser;

    const hash = await bcrypt.hash(password, 10);
    const createdUser = await User.create({
      name,
      email,
      password: hash,
      isAdmin,
      isLogin: true,
    });
    return {
      success: true,
      message: "Đăng ký thành công",
      data: createdUser,
    };
  } catch (error) {
    throw new Error(error);
  }
};
const loginUser = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error("Email không tồn tại");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Mật khẩu không đúng");

    const access_token = jwtService?.generateAccessToken(user);
    const refresh_token = jwtService?.generateRefreshToken(user);

    user.isLogin = true;
    await user.save();
    return {
      success: true,
      message: "Đăng nhập thành công",
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      _id: user._id,
      isLogin: true,
      token: {
        access_token,
        refresh_token
      }
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

const createUser = async (newUser) => {
  try {
    const { avatar, name, email, phone, password, isAdmin } = newUser;

    const hash = await bcrypt.hashSync(password, 10);
    const createdUser = await User.create({
      avatar,
      name,
      email,
      phone,
      password: hash,
      isAdmin,
      isActive: true,
    });
    return {
      success: true,
      message: "Tạo user thành công",
      data: createdUser,
    };
  } catch (error) {
    throw new Error(error);
  }
};

const updateUser = async (id, data) => {
  try {
    const { name, phone, password, newPassword, address, avatar } = data;

    // Tìm user hiện tại
    const userCurrent = await User.findById(id);
    if (!userCurrent) {
      throw new Error("User không tồn tại");
    }
    // Chỉ cập nhật những field được cung cấp
    const updateData = {};
    if (name && name !== "") updateData.name = name;
    if (address) updateData.address = address;
    if (avatar) updateData.avatar = avatar;
    if (phone && /^\d{10}$/.test(phone)) {
      updateData.phone = phone;
    }

    // Nếu cập nhật mật khẩu
    if (password && newPassword && typeof newPassword === "string") {
      const isPasswordCorrect = await bcrypt.compare(
        password,
        userCurrent.password
      );
      if (!isPasswordCorrect) {
        throw new Error("Mật khẩu cũ không đúng");
      }

      if (newPassword === password) {
        throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Thực hiện cập nhật
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return {
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

export const userService = {
  registerUser,
  loginUser,
  updateUser,
  createUser,
};
