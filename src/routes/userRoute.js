import express from "express";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware"; // Import authMiddleware
import { userController } from "~/controllers/userController";
import { upload } from "~/config/Mullter";
const Router = express.Router();

// Route công khai: Không cần authMiddleware
Router.post("/sign-up", userController.registerUser);
Router.post("/sign-in", userController.loginUser);
Router.post("/refresh-token", userController.refreshToken);

// Route cần xác thực: Cần authMiddleware để đảm bảo người dùng đã đăng nhập
Router.post("/create", upload.single("avatar"), userController.createUser);
Router.put("/update-user", authMiddleware, upload.single("avatar"), userController.updateUser);
Router.get("/get-detail/:id", authMiddleware, userController.getDetail);
Router.get("/getall", authMiddleware, isAdmin, userController.getAllUser);
Router.delete(
  "/delete-user",
  authMiddleware,
  isAdmin,
  userController.deleteUser
);
Router.delete(
  "/delete-all-user",
  authMiddleware,
  isAdmin,
  userController.deleteAllUsers
);

export const userRoute = Router;
