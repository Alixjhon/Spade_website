import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getDashboard } from "../services/dashboardService.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const payload = await getDashboard(String(req.query.email || ""));
    res.json(payload);
  }),
);
