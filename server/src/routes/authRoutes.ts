import crypto from "node:crypto";
import { Router } from "express";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuthenticatedUser, requireAuth } from "../middleware/authMiddleware.js";
import { login, loginWithGoogle, registerApplicant, updateProfile } from "../services/authService.js";

export const authRouter = Router();

const oauthStates = new Map<string, number>();
const oauthResults = new Map<string, { expiresAt: number; result: Awaited<ReturnType<typeof loginWithGoogle>> }>();

function getGoogleConfig() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new AppError("Google login is not configured on the server.", 503);
  }
  return { clientId: env.googleClientId, clientSecret: env.googleClientSecret, redirectUri: env.googleRedirectUri };
}

authRouter.get("/google", (_req, res) => {
  const config = getGoogleConfig();
  const state = crypto.randomBytes(24).toString("hex");
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    state,
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

authRouter.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const config = getGoogleConfig();
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const stateExpiresAt = oauthStates.get(state);
    oauthStates.delete(state);
    if (!stateExpiresAt || stateExpiresAt < Date.now() || !code) {
      throw new AppError("Google login could not be verified.", 400);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: config.redirectUri, grant_type: "authorization_code" }),
    });
    if (!tokenResponse.ok) throw new AppError("Google login could not be completed.", 401);
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token) throw new AppError("Google did not return an access token.", 401);

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = (await profileResponse.json()) as { email?: string; name?: string; picture?: string; email_verified?: boolean };
    if (!profileResponse.ok || !profile.email || profile.email_verified !== true) {
      throw new AppError("Google did not provide a verified email address.", 401);
    }

    const result = await loginWithGoogle(profile.email, profile.name || "", profile.picture || "");
    const handoffCode = crypto.randomBytes(24).toString("hex");
    oauthResults.set(handoffCode, { expiresAt: Date.now() + 2 * 60 * 1000, result });
    res.redirect(`${env.appBaseUrl}/#/?googleCode=${handoffCode}`);
  }),
);

authRouter.post("/google/exchange", (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const handoff = oauthResults.get(code);
  oauthResults.delete(code);
  if (!handoff || handoff.expiresAt < Date.now()) {
    throw new AppError("Google login session expired. Please try again.", 400);
  }
  res.json(handoff.result);
});

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
