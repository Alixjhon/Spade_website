import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";
import { createAuthToken } from "../lib/authToken.js";
import { mapApplicant } from "../mappers/applicantMapper.js";
import { createActivity } from "../repositories/activityRepository.js";
import { createPendingUser, findApplicantById, findUserForLogin, updateUserProfileByEmail } from "../repositories/userRepository.js";
import type { RegisterApplicantInput, UpdateProfileInput } from "../types/domain.js";

const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

const loginAttempts = new Map<
  string,
  {
    failedAttempts: number;
    lockedUntil: number;
  }
>();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getLoginAttemptState(email: string) {
  const key = normalizeEmail(email);
  const state = loginAttempts.get(key);

  if (!state) {
    return null;
  }

  if (state.lockedUntil && state.lockedUntil <= Date.now()) {
    loginAttempts.delete(key);
    return null;
  }

  return state;
}

function assertLoginAllowed(email: string) {
  const state = getLoginAttemptState(email);
  if (state?.lockedUntil && state.lockedUntil > Date.now()) {
    const remainingMinutes = Math.ceil((state.lockedUntil - Date.now()) / 60000);
    throw new AppError(
      `Too many failed login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}.`,
      429,
    );
  }
}

function recordFailedLogin(email: string) {
  const key = normalizeEmail(email);
  const current = getLoginAttemptState(email);
  const failedAttempts = (current?.failedAttempts ?? 0) + 1;
  const lockedUntil = failedAttempts >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOGIN_LOCKOUT_MS : 0;

  loginAttempts.set(key, {
    failedAttempts,
    lockedUntil,
  });
}

function clearFailedLogins(email: string) {
  loginAttempts.delete(normalizeEmail(email));
}

export async function login(email: string, password: string) {
  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail.endsWith(env.allowedEmailDomain)) {
    throw new AppError(`Only ${env.allowedEmailDomain} emails are allowed.`, 400);
  }

  assertLoginAllowed(normalizedEmail);

  const user = await findUserForLogin(normalizedEmail);
  if (!user || user.password !== password) {
    recordFailedLogin(normalizedEmail);
    throw new AppError("Invalid email or password.", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Your account is not active yet.", 403);
  }

  clearFailedLogins(normalizedEmail);

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
    !input.contactNumber
  ) {
    throw new AppError("Please complete the onboarding form before submitting.", 400);
  }

  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail.endsWith(env.allowedEmailDomain)) {
    throw new AppError(`Only ${env.allowedEmailDomain} emails are allowed.`, 400);
  }

  try {
    await pool.query("BEGIN");
    const userId = await createPendingUser({
      name: input.name.trim(),
      email: normalizedEmail,
      password: input.password,
      role: input.role,
      location: input.location.trim(),
      course: input.course.trim(),
      yearLevel: input.yearLevel.trim(),
      contactNumber: input.contactNumber.trim(),
      profilePictureUrl: input.profilePictureUrl || "",
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
