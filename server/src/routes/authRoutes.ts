import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuthenticatedUser, requireAuth } from "../middleware/authMiddleware.js";
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
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = getAuthenticatedUser(req);
    const user = await updateProfile({ ...req.body, email: authUser.email });
    res.json({ user });
  }),
);

authRouter.post(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const authUser = getAuthenticatedUser(req);
    const user = await updateProfile({ ...req.body, email: authUser.email });
    res.json({ user });
  }),
);
