import userModel from "~/models/UserModel";
import bcrypt from "bcrypt";
import { jwtService } from "./jwtService";

const registerUser = async (newUser) => {
  try {
    const { name, email, phone, password, isAdmin } = newUser;

    const hash = bcrypt.hashSync(password, 10);
    const createdUser = await userModel.create({
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
    throw error;
  }
};
const loginUser = async (userLogin) => {
  try {
    const { email, password } = userLogin;
    let checkUser = await userModel.findOne({ email });

    if (!checkUser) throw new Error("Email không tồn tại");

    const checkPass = await bcrypt.compare(password, checkUser.password);
    if (!checkPass) throw new Error("Mật khẩu không đúng");

    const access_token = jwtService.generateAccessToken(checkUser);
    const refresh_token = jwtService.generateRefreshToken(checkUser);
    const { password: _password, ...user } = checkUser.toObject(); // Chuyển từ Mongoose Document sang object

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

const updateUser = async (id, data) => {
  try {
    const { name, email, phone, password, newPassword, address, avatar } = data;

    // Tìm user hiện tại
    const userCurrent = await userModel.findById(id);
    if (!userCurrent) {
      throw new Error("User không tồn tại");
    }
    // Chỉ cập nhật những field được cung cấp
    console.log("avatar", avatar);
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
    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, {
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

const deleteUser = async (id) => {
  try {
    const userCurrent = await userModel.findById(id);
    if (!userCurrent) {
      throw new Error("User không tồn tại");
    }
    await userModel.findByIdAndDelete(id);
    return {
      message: "Xóa tài khoản thành công",
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

const getDetail = async (id) => {
  try {
    const user = await userModel.findById(id, "-password");
    if (!user) {
      throw new Error("User không tồn tại");
    }
    return { user };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

export const userService = {
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  getDetail,
};
