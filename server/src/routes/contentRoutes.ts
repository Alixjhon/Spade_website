import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuthenticatedUser, requireAuth, requirePresident } from "../middleware/authMiddleware.js";
import { createEventEntry, getEvents, getMeeting, getProjects, getActivities, createActivity, submitProject, editActivity, editProject } from "../services/contentService.js";

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
    const user = getAuthenticatedUser(req);
    const event = await createEventEntry(req.body, user.email);
    res.status(201).json({ event });
  }),
);

contentRouter.get(
  "/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const projects = await getProjects(user.role);
    res.json({ projects });
  }),
);

contentRouter.post(
  "/projects",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const project = await submitProject({
      ...req.body,
      submittedByEmail: user.email,
    }, user.role);
    res.status(201).json({ project });
  }),
);

contentRouter.patch(
  "/projects/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const project = await editProject(Number(req.params.id), req.body, user.email, user.role);
    res.json({ project });
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
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const activities = await getActivities(user.role);
    res.json({ activities });
  }),
);

contentRouter.post(
  "/activities",
  requirePresident,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const activity = await createActivity(req.body, user.email);
    res.status(201).json({ activity });
  }),
);

contentRouter.patch(
  "/activities/:id",
  requirePresident,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const activity = await editActivity(Number(req.params.id), req.body, user.email, user.role);
    res.json({ activity });
  }),
);
