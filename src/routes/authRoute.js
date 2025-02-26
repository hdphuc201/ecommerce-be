import express from "express";
import { authController } from "~/controllers/authController";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware";

const Router = express.Router();

// Route chỉ dành cho admin
Router.get("/getall", authMiddleware, isAdmin, authController.getAllUser);
Router.delete(
  "/delete-user/:id",
  authMiddleware,
  isAdmin,
  authController.deleteUser
);
Router.delete(
  "/delete-all-user",
  authMiddleware,
  isAdmin,
  authController.deleteAllUsers
);

export const authRoute = Router;
