import express from "express";
import { discountController } from "./../controllers/discountController";
import {
  authMiddleware,
  isAdmin,
} from "../../build/src/middlewares/authMiddleware";

const Router = express.Router();

console.log("discount Router");
Router.post(
  "/createDiscount",
  authMiddleware,
  isAdmin,
  discountController.createDiscount
);
Router.get("/getDiscount", discountController.getAllDiscounts);
Router.post("/validate", discountController.validateDiscountCode);
Router.delete(
  "/deleteDiscount",
  authMiddleware,
  isAdmin,
  discountController.deleteDiscount
);

Router.put(
  "/updateDiscount",
  authMiddleware,
  isAdmin,
  discountController.updateDiscount
);

export const discountRoute = Router;
