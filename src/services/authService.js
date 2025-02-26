import userModel from "~/models/UserModel";
import bcrypt from "bcrypt";

const deleteUser = async (id) => {
  try {
    const userCurrent = await userModel.findById(id);
    if (!userCurrent) {
      throw new Error("User không tồn tại");
    }
    await userModel.findByIdAndDelete(id);
    return {
      message: "Xóa tài khoản user thành công",
    };
  } catch (error) {
    return { success: false, message: error.message || "Lỗi server" };
  }
};

const deleteAllUsers = async (passwordAdmin) => {
  try {
    const admin = await userModel.findOne({ isAdmin: true });
    if (!admin) return { message: "Không tìm thấy tài khoản admin" };

    const isMatch = await bcrypt.compare(passwordAdmin, admin?.password);
    if (!isMatch) return { message: "Password admin không trùng khớp" };

    const result = await userModel.deleteMany({ isAdmin: false });
    if (!result.success) return { message: "Không có người dùng nào" };

    return {
      message: "Xóa tất cả user thành công",
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const authService = { deleteUser, deleteAllUsers };
