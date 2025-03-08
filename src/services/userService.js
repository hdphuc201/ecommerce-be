import User from "~/models/userModel";
import bcrypt from "bcrypt";
import { jwtService } from "./jwtService";

const registerUser = async (newUser) => {
  try {
    const { name, email, password, isAdmin } = newUser;

    const hash = bcrypt.hashSync(password, 10);
    const createdUser = await User.create({
      name,
      email,
      password: hash,
      isAdmin,
    });
    return {
      success: true,
      message: "Đăng ký thành công",
      data: createdUser,
    };
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};
const loginUser = async (userLogin) => {
  try {
    const { email, password } = userLogin;
    let checkUser = await User.findOne({ email });
    if (!checkUser) throw new Error("Email không tồn tại");

    const checkPass = await bcrypt.compare(password, checkUser.password);
    if (!checkPass) throw new Error("Mật khẩu không đúng");

    const access_token = jwtService.generateAccessToken(checkUser);
    const refresh_token = jwtService.generateRefreshToken(checkUser);
    const { password: _password, ...user } = checkUser
      ? checkUser.toObject()
      : {}; // Chuyển từ Mongoose Document sang object

    return {
      success: true,
      message: "Đăng nhập thành công",
      ...user,
      access_token,
      refresh_token,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

const createUser = async (newUser) => {
  try {
    const { avatar, name, email, phone, password, isAdmin } = newUser;

    const hash = bcrypt.hashSync(password, 10);
    const createdUser = await User.create({
      avatar,
      name,
      email,
      phone,
      password: hash,
      isAdmin,
    });
    return {
      success: true,
      message: "Tạo user thành công",
      data: createdUser,
    };
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};

const getDetail = async (id) => {
  try {
    const user = await User.findById(id, "-password");
    if (!user) {
      throw new Error("User không tồn tại");
    }
    return { user };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
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

const deleteAllUsers = async (passwordAdmin) => {
  try {
    const admin = await User.findOne({ isAdmin: true });
    if (!admin)
      return { success: false, message: "Không tìm thấy tài khoản admin" };

    const isMatch = await bcrypt.compare(passwordAdmin, admin.password);
    if (!isMatch)
      return { success: false, message: "Password admin không trùng khớp" };

    const result = await User.deleteMany({ isAdmin: false });
    // Kiểm tra nếu không có user nào bị xóa
    if (result.deletedCount === 0) {
      return { success: false, message: "Không có người dùng nào để xóa" };
    }

    return {
      success: true,
      message: "Xóa tất cả user thành công",
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

export const userService = {
  registerUser,
  loginUser,
  updateUser,
  getDetail,
  createUser,
  deleteAllUsers,
};
