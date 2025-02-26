import express from "express";
import { userController } from "~/controllers/userController";
import { authMiddleware } from "~/middlewares/authMiddleware"; // Import authMiddleware

const Router = express.Router();

// Route công khai: Không cần authMiddleware
Router.post("/sign-up", userController.registerUser);
Router.post("/sign-in", userController.loginUser);
Router.post("/refresh-token", userController.refreshToken);

// Route cần xác thực: Cần authMiddleware để đảm bảo người dùng đã đăng nhập
Router.put("/update-user", authMiddleware, userController.updateUser);
Router.delete("/delete-user/:id", authMiddleware, userController.deleteUser);
Router.get("/get-detail/:id", authMiddleware, userController.getDetail);

export const userRoute = Router;
