import express from "express";
import { productController } from "~/controllers/productController";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware";

const Router = express.Router();

// Các route yêu cầu xác thực
Router.post(
  "/create-product",
  authMiddleware,
  isAdmin,
  productController.createProduct
);

Router.put(
  "/update-product/:id",
  authMiddleware,
  isAdmin,
  productController.updateProduct
);
Router.delete(
  "/delete-product/:id",
  authMiddleware,
  isAdmin,
  productController.deleteProduct
);
Router.delete(
  "/delete-all-product",
  authMiddleware,
  isAdmin,
  productController.deleteAllProduct
);
Router.post(
  "/category-product",
  authMiddleware,
  isAdmin,
  productController.createCategoryProduct
);
Router.get(
  "/getCategory",
  authMiddleware,
  isAdmin,
  productController.getCategoryProduct
);

// Các route không yêu cầu xác thực (public)
Router.get("/get-detail/:id", productController.getDetailProduct);
Router.get("/getAllProduct", productController.getAllProduct);
// Router.post("/read-product", productController.readProduct);
export const productRoute = Router;
