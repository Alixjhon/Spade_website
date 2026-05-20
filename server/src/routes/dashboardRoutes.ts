import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuthenticatedUser, requireAuth } from "../middleware/authMiddleware.js";
import { getDashboard } from "../services/dashboardService.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const payload = await getDashboard(user.email);
    res.json(payload);
  }),
);
