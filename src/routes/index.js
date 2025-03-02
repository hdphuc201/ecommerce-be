import express from "express";
import { userRoute } from "./userRoute";
import { productRoute } from "./productRoute";
import { orderRoute } from "./orderRoute";

const Router = express.Router();

Router.use("/api/user", userRoute);
Router.use("/api/product", productRoute);
Router.use("/api/order", orderRoute);


export { Router };
