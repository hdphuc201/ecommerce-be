import userModel from "~/models/UserModel";
import { authService } from "~/services/authService";

const deleteAllUsers = async (req, res, next) => {
  try {
    const { passwordAdmin } = req.body;
    if (!passwordAdmin)
      res.status(400).json({ message: "Password admin là bắt buộc" });

    const result = await authService.deleteAllUsers(passwordAdmin);
    if (!result.success) return res.status(400).json(result);
  } catch (error) {
    next(error);
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const users = await userModel.find({}, "-password"); // không lấy password
    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Bắt buộc phải có ID" });

    const result = await authService.deleteUser(id);
    if (!result.success) return res.status(400).json(result);
  } catch (error) {
    next(error);
  }
};
export const authController = {
  deleteAllUsers,
  getAllUser,
  deleteUser,
};
