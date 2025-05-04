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

export const chartRoute = Router;
