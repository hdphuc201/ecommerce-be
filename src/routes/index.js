import express from "express";

import { cartRoute } from "./cartRoute";
import { chartRoute } from "./chartRoute";
import { discountRoute } from "./discountRoute";
import { orderRoute } from "./orderRoute";
import { productRoute } from "./productRoute";
import { reviewRoute } from "./reviewRoute";
import { userRoute } from "./userRoute";

const Router = express.Router();

Router.use("/api/user", userRoute);
Router.use("/api/product", productRoute);
Router.use("/api/order", orderRoute);
Router.use("/api/cart", cartRoute);
Router.use("/api/chart", chartRoute);
Router.use("/api/discount", discountRoute);
Router.use("/api/reviews", reviewRoute);

export { Router };
