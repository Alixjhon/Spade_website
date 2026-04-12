import { AppError } from "../lib/appError.js";
import { mapApplicant } from "../mappers/applicantMapper.js";
import { createActivity } from "../repositories/activityRepository.js";
import { findApplicantById, listPendingApplicants, updateUserStatus } from "../repositories/userRepository.js";

export async function getApplicants() {
  const applicants = await listPendingApplicants();
  return applicants.map(mapApplicant);
}

export async function reviewApplicant(id: number, status: "approved" | "rejected") {
  if (!["approved", "rejected"].includes(status)) {
    throw new AppError("Status must be approved or rejected.", 400);
  }

  const applicant = await findApplicantById(id);
  if (!applicant) {
    throw new AppError("Applicant not found.", 404);
  }

  await updateUserStatus(id, status === "approved" ? "active" : "rejected");
  await createActivity(applicant.name, `${status} membership application`, "applicant");

  return {
    ...mapApplicant(applicant),
    status,
  };
}
