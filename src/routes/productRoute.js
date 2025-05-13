import express from "express";

import { uploadProduct } from "~/config/multer";
import { productController } from "~/controllers/productController";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware";

const Router = express.Router();

// Các route yêu cầu xác thực
Router.post(
  "/create-product",
  authMiddleware,
  isAdmin,
  uploadProduct.array("image", 12),
  productController.createProduct
);

Router.put(
  "/update-product",
  authMiddleware,
  isAdmin,
  uploadProduct.array("image"),
  productController.updateProduct
);
Router.put("/update-stock", productController.updateProductStock);
Router.delete(
  "/delete-product",
  authMiddleware,
  isAdmin,
  productController.deleteProduct
);

// Các route không yêu cầu xác thực (public)
Router.get("/get-detail/:id", productController.getDetailProduct);
Router.get("/getAllProduct", productController.getAllProduct);
Router.post("/search", productController.searchProduct);


export const productRoute = Router;
