import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { login, registerApplicant, updateProfile } from "../services/authService.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const result = await login(req.body?.email as string, req.body?.password as string);
    res.json(result);
  }),
);

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const applicant = await registerApplicant(req.body);
    res.status(201).json({ applicant });
  }),
);

authRouter.patch(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await updateProfile(req.body);
    res.json({ user });
  }),
);

authRouter.post(
  "/profile",
  asyncHandler(async (req, res) => {
    const user = await updateProfile(req.body);
    res.json({ user });
  }),
);
