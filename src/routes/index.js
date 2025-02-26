import express from "express";
import { userRoute } from "./userRoute";
import { productRoute } from "./productRoute";
import { authRoute } from "./authRoute";

const Router = express.Router();

Router.use("/api/user", userRoute);
Router.use("/api/product", productRoute);

// auth
Router.use("/api/auth", authRoute);

export { Router };
