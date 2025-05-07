import express from "express";

import { wishlistController } from "~/controllers/wishlistController";
import { authMiddleware } from "~/middlewares/authMiddleware";
const Router = express.Router();

Router.get("/get", authMiddleware, wishlistController.getWishlist);
Router.post("/add", authMiddleware, wishlistController.addWishlist);
Router.delete("/delete", authMiddleware, wishlistController.deleteWishlist);

export const wishlistRoute = Router;
