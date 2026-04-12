import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { fileCandidacy, getElection, saveElectionSettings, vote } from "../services/electionService.js";

export const electionRouter = Router();

electionRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const payload = await getElection(String(req.query.email || ""));
    res.json(payload);
  }),
);

electionRouter.post(
  "/candidates",
  asyncHandler(async (req, res) => {
    const candidate = await fileCandidacy(req.body);
    res.status(201).json({ candidate });
  }),
);

electionRouter.post(
  "/vote",
  asyncHandler(async (req, res) => {
    const result = await vote(req.body);
    res.status(201).json(result);
  }),
);

electionRouter.patch(
  "/settings",
  asyncHandler(async (req, res) => {
    const election = await saveElectionSettings(req.body);
    res.json({ election });
  }),
);
