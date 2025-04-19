import express from "express";
import { uploadProduct } from "~/config/multer";
import { reviewController } from "~/controllers/reviewController";
import { authMiddleware } from "~/middlewares/authMiddleware"; // Import authMiddleware

const Router = express.Router();

Router.post(
  "/add",
  authMiddleware,
  uploadProduct.array("images", 5), // image
  reviewController.addReview
);
Router.put("/update", authMiddleware, reviewController.updateReview);
Router.get("/get", reviewController.getReviews);
Router.delete("/delete-all", reviewController.deleteAllReviews);

export const reviewRoute = Router;
