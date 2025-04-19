import express from "express";
import { userRoute } from "./userRoute";
import { productRoute } from "./productRoute";
import { orderRoute } from "./orderRoute";
import { cartRoute } from "./cartRoute";
import { chartRoute } from "./chartRoute";
import { discountRoute } from "./discountRoute";
import { reviewRoute } from "./reviewRoute";

const Router = express.Router();

Router.use("/api/user", userRoute);
Router.use("/api/product", productRoute);
Router.use("/api/order", orderRoute);
Router.use("/api/cart", cartRoute);
Router.use("/api/chart", chartRoute);
Router.use("/api/discount", discountRoute);
Router.use("/api/reviews", reviewRoute);

export { Router };
