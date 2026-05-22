import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuthenticatedUser, requireAuth } from "../middleware/authMiddleware.js";
import {
  getUnreadNotifications,
  readNotification,
} from "../services/notificationService.js";

export const notificationRouter = Router();

notificationRouter.get(
  "/unread",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const notifications = await getUnreadNotifications(user.email);
    res.json({ notifications });
  }),
);

notificationRouter.post(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const ok = await readNotification({
      id: Number(req.params.id),
      userEmail: user.email,
    });
    res.json({ ok });
  }),
);
