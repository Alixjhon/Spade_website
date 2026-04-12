import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { createEventEntry, getEvents, getMeeting, getProjects, getActivities, createActivity } from "../services/contentService.js";

export const contentRouter = Router();

contentRouter.get(
  "/events",
  asyncHandler(async (_req, res) => {
    const events = await getEvents();
    res.json({ events });
  }),
);

contentRouter.post(
  "/events",
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await createEventEntry(req.body, (req as any).user?.email || "");
    res.status(201).json({ event });
  }),
);

contentRouter.get(
  "/projects",
  asyncHandler(async (_req, res) => {
    const projects = await getProjects();
    res.json({ projects });
  }),
);

contentRouter.get(
  "/meetings",
  asyncHandler(async (_req, res) => {
    const meeting = await getMeeting();
    res.json({ meeting });
  }),
);

contentRouter.get(
  "/activities",
  asyncHandler(async (_req, res) => {
    const activities = await getActivities();
    res.json({ activities });
  }),
);

contentRouter.post(
  "/activities",
  requireAuth,
  asyncHandler(async (req, res) => {
    const activity = await createActivity(req.body, (req as any).user?.email || "");
    res.status(201).json({ activity });
  }),
);
