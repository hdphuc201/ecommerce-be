import express from "express";
import { upload } from "~/config/Mullter";
import { productController } from "~/controllers/productController";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware";

const Router = express.Router();

// Các route yêu cầu xác thực
Router.post(
  "/create-product",
  authMiddleware,
  isAdmin,
  upload.array("image", 12),
  productController.createProduct
);

Router.put(
  "/update-product",
  authMiddleware,
  isAdmin,
  upload.single("image"),
  productController.updateProduct
);
Router.delete(
  "/delete-product",
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

// Các route không yêu cầu xác thực (public)
Router.get("/get-detail/:id", productController.getDetailProduct);
Router.get("/getAllProduct", productController.getAllProduct);
Router.post("/search", productController.searchProduct);

// cate
Router.get("/getCategory", productController.getCate);
Router.post(
  "/create-category",
  authMiddleware,
  isAdmin,
  productController.createCate
);
Router.delete(
  "/delete-cateogry",
  authMiddleware,
  isAdmin,
  productController.deleteCate
);
Router.delete(
  "/delete-all-cateogry",
  authMiddleware,
  isAdmin,
  productController.deleteAllCate
);

export const productRoute = Router;
