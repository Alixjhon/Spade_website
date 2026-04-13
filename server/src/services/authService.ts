import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";
import { createAuthToken } from "../lib/authToken.js";
import { mapApplicant } from "../mappers/applicantMapper.js";
import { createActivity } from "../repositories/activityRepository.js";
import { createApplicantProject } from "../repositories/applicantProjectRepository.js";
import { createPendingUser, findApplicantById, findUserForLogin, updateUserProfileByEmail } from "../repositories/userRepository.js";
import type { RegisterApplicantInput, UpdateProfileInput } from "../types/domain.js";

export async function login(email: string, password: string) {
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  if (!email.endsWith(env.allowedEmailDomain)) {
    throw new AppError(`Only ${env.allowedEmailDomain} emails are allowed.`, 400);
  }

  const user = await findUserForLogin(email);
  if (!user || user.password !== password) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Your account is not active yet.", 403);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      location: user.location,
      course: user.course,
      yearLevel: user.yearLevel,
      contactNumber: user.contactNumber,
      profilePictureUrl: user.profilePictureUrl,
    },
    token: createAuthToken({
      email: user.email,
      role: user.role,
      name: user.name,
    }),
  };
}

export async function registerApplicant(input: RegisterApplicantInput) {
  if (
    !input.email ||
    !input.password ||
    !input.role ||
    !input.name ||
    !input.location ||
    !input.course ||
    !input.yearLevel ||
    !input.contactNumber ||
    !input.projectTitle ||
    !input.projectDescription
  ) {
    throw new AppError("Please complete the onboarding form before submitting.", 400);
  }

  if (!input.email.endsWith(env.allowedEmailDomain)) {
    throw new AppError(`Only ${env.allowedEmailDomain} emails are allowed.`, 400);
  }

  try {
    await pool.query("BEGIN");
    const userId = await createPendingUser({
      name: input.name.trim(),
      email: input.email,
      password: input.password,
      role: input.role,
      location: input.location.trim(),
      course: input.course.trim(),
      yearLevel: input.yearLevel.trim(),
      contactNumber: input.contactNumber.trim(),
      profilePictureUrl: input.profilePictureUrl || "",
    });

    await createApplicantProject({
      userId,
      title: input.projectTitle.trim(),
      description: input.projectDescription.trim(),
      attachmentName: input.projectAttachmentName || "",
      attachmentUrl: input.projectAttachmentUrl || "",
    });

    await createActivity(input.name.trim(), "submitted membership application", "applicant");
    await pool.query("COMMIT");

    const applicant = await findApplicantById(userId);
    return applicant ? mapApplicant(applicant) : null;
  } catch (error) {
    await pool.query("ROLLBACK");
    const maybeError = error as { code?: string };
    if (maybeError.code === "23505") {
      throw new AppError("An account or application with this email already exists.", 409);
    }
    throw error;
  }
}

export async function updateProfile(input: UpdateProfileInput) {
  if (!input.email) {
    throw new AppError("User email is required.", 400);
  }

  if (!input.name?.trim()) {
    throw new AppError("Name is required.", 400);
  }

  const updatedUser = await updateUserProfileByEmail({
    email: input.email,
    name: input.name.trim(),
    location: input.location?.trim() || "",
    course: input.course?.trim() || "",
    yearLevel: input.yearLevel?.trim() || "",
    contactNumber: input.contactNumber?.trim() || "",
    profilePictureUrl: input.profilePictureUrl || "",
  });

  if (!updatedUser) {
    throw new AppError("User not found.", 404);
  }

  return updatedUser;
}
