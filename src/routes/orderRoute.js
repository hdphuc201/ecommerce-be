import express from "express";
import { orderController } from "~/controllers/orderController";
import { authMiddleware } from "~/middlewares/authMiddleware";
const Router = express.Router();

Router.get("/get", authMiddleware, orderController.getOrder);
Router.get("/getOrderAdmin", authMiddleware, orderController.getOrderAdmin);
Router.post("/create", orderController.createOrder);

export const orderRoute = Router;
