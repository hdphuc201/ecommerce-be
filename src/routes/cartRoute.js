import express from "express";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware"; // Import authMiddleware
import { cartController } from "~/controllers/cartController";
const Router = express.Router();

Router.get("/get", authMiddleware, cartController.getCart);
Router.post("/add", authMiddleware, cartController.addCart);
Router.put("/update", authMiddleware, cartController.updateCart);
Router.delete("/delete", authMiddleware, cartController.removeCart);

export const cartRoute = Router;
