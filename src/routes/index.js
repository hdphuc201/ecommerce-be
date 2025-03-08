import express from "express";
import { userRoute } from "./userRoute";
import { productRoute } from "./productRoute";
import { orderRoute } from "./orderRoute";
import { cartRoute } from "./cartRoute";

const Router = express.Router();

Router.use("/api/user", userRoute);
Router.use("/api/product", productRoute);
Router.use("/api/order", orderRoute);
Router.use("/api/cart", cartRoute);


export { Router };
