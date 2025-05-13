import express from "express";

import { categoryController } from "~/controllers/categoryController";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware";

const Router = express.Router();
Router.get("/getCategory", categoryController.getCate);
Router.post(
  "/create-category-parent",
  authMiddleware,
  isAdmin,
  categoryController.createParentCategory
);
Router.post(
  "/create-category-childrent",
  authMiddleware,
  isAdmin,
  categoryController.createChildCategory
);
Router.delete(
  "/delete-cateogry",
  authMiddleware,
  isAdmin,
  categoryController.deleteCate
);


export const categoryRoute = Router;
