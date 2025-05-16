import express from "express";

import { uploadUser } from "~/config/multer";
import { userController } from "~/controllers/userController";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware"; // Import authMiddleware
const Router = express.Router();

// Route công khai: Không cần authMiddleware
Router.post("/sign-up", userController.registerUser);
Router.post("/sign-in", userController.loginUser);
Router.post("/sign-in-google", userController.loginGoogle);
Router.post("/verify-email", userController.verifyEmail);
Router.post("/sign-out", authMiddleware, userController.logoutUser);
Router.post("/refresh-token", userController.refreshToken);

// Route cần xác thực: Cần authMiddleware để đảm bảo người dùng đã đăng nhập
Router.post("/create", uploadUser.single("avatar"), userController.createUser);
Router.put(
  "/update-user",
  authMiddleware,
  uploadUser.single("avatar"),
  userController.updateUser
);
Router.get("/get-detail/:id", authMiddleware, userController.getDetail);
Router.get("/getall", authMiddleware, isAdmin, userController.getAllUser);
Router.delete(
  "/delete-user",
  authMiddleware,
  isAdmin,
  userController.deleteUser
);

Router.get("/getAddress", authMiddleware, userController.getAddress);
Router.post("/createAddress", authMiddleware, userController.createAddress);
Router.delete("/removeAddress", authMiddleware, userController.removeAddress);
Router.put("/updateAddress", authMiddleware, userController.updateAddress);

Router.put("/change-password", userController.changePassword);
Router.put("/update-password", userController.updateUserPassword);

export const userRoute = Router;
