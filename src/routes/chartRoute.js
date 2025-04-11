import express from "express";
import { authMiddleware, isAdmin } from "~/middlewares/authMiddleware"; // Import authMiddleware
import { chartController } from "~/controllers/chartController";

const Router = express.Router();
Router.get(
  "/stats",
  authMiddleware,
  isAdmin,
  chartController.getRevenueStatistics
);

export const chartRoute = Router;
