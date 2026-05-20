import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuthenticatedUser, requireAuth, requirePresident } from "../middleware/authMiddleware.js";
import { fileCandidacy, getElection, saveElectionSettings, vote } from "../services/electionService.js";

export const electionRouter = Router();

electionRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const payload = await getElection(user.email);
    res.json(payload);
  }),
);

electionRouter.post(
  "/candidates",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const candidate = await fileCandidacy({ ...req.body, email: user.email });
    res.status(201).json({ candidate });
  }),
);

electionRouter.post(
  "/vote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const result = await vote({ ...req.body, email: user.email });
    res.status(201).json(result);
  }),
);

electionRouter.patch(
  "/settings",
  requirePresident,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const election = await saveElectionSettings({ ...req.body, email: user.email });
    res.json({ election });
  }),
);
