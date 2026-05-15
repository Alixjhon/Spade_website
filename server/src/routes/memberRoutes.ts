import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { deleteUserById, listActiveUsers } from "../repositories/userRepository.js";
import { AppError } from "../lib/appError.js";
import { requireOfficer } from "../middleware/authMiddleware.js";

export const memberRouter = Router();

memberRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const members = await listActiveUsers();
    res.json({ members });
  }),
);

memberRouter.delete(
  "/:id",
  requireOfficer,
  asyncHandler(async (req, res) => {
    const deleted = await deleteUserById(Number(req.params.id));
    if (!deleted) {
      throw new AppError("Member not found.", 404);
    }

    res.json({ ok: true });
  }),
);
