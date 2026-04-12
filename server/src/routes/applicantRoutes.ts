import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getApplicants, reviewApplicant } from "../services/applicantService.js";

export const applicantRouter = Router();

applicantRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const applicants = await getApplicants();
    res.json({ applicants });
  }),
);

applicantRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const applicant = await reviewApplicant(Number(req.params.id), req.body?.status as "approved" | "rejected");
    res.json({ applicant });
  }),
);
