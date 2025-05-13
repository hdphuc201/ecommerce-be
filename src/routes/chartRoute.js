import express from "express";

import { chartController } from "~/controllers/chartController";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware"; // Import authMiddleware

const Router = express.Router();
Router.get(
  "/stats",
  authMiddleware,
  isAdmin,
  chartController.getRevenueStatistics
);

Router.post(
  "/stats/products",
  authMiddleware,
  isAdmin,
  chartController.getProductsInPeriod
);

export const chartRoute = Router;
