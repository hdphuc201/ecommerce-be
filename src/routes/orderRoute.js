import express from "express";
import { orderController } from "~/controllers/orderController";
const Router = express.Router();

Router.post("/create", orderController.createOrder);


export const orderRoute = Router;
