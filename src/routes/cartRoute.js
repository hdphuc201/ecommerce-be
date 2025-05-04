import express from "express";

import { cartController } from "~/controllers/cartController";
import { authMiddleware } from "~/middlewares/authMiddleware"; // Import authMiddleware
const Router = express.Router();

Router.get("/get", authMiddleware, cartController.getCart);
Router.post("/add", authMiddleware, cartController.addCart);
Router.put("/update", authMiddleware, cartController.updateCart);
Router.delete("/delete", authMiddleware, cartController.removeCart);

export const cartRoute = Router;
