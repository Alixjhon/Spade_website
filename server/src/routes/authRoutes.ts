import crypto from "node:crypto";
import { Router } from "express";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuthenticatedUser, requireAuth } from "../middleware/authMiddleware.js";
import { login, loginWithGoogle, registerApplicant, updateProfile } from "../services/authService.js";

export const authRouter = Router();

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const OAUTH_HANDOFF_TTL_MS = 2 * 60 * 1000;

function oauthKey() {
  return crypto.createHash("sha256").update(env.jwtSecret).digest();
}

function createOAuthState() {
  const expiresAt = Date.now() + OAUTH_STATE_TTL_MS;
  const value = `${expiresAt}.${crypto.randomBytes(24).toString("hex")}`;
  const signature = crypto.createHmac("sha256", env.jwtSecret).update(value).digest("base64url");
  return `${value}.${signature}`;
}

function isValidOAuthState(state: string) {
  const parts = state.split(".");
  if (parts.length !== 3) return false;

  const [expiresAtValue, nonce, signature] = parts;
  const value = `${expiresAtValue}.${nonce}`;
  const expectedSignature = crypto.createHmac("sha256", env.jwtSecret).update(value).digest("base64url");
  const actualBuffer = Buffer.from(signature || "");
  const expectedBuffer = Buffer.from(expectedSignature);

  return Number(expiresAtValue) > Date.now()
    && Boolean(nonce)
    && actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

function createOAuthHandoff(result: Awaited<ReturnType<typeof loginWithGoogle>>) {
  const payload = Buffer.from(JSON.stringify({ expiresAt: Date.now() + OAUTH_HANDOFF_TTL_MS, result })).toString("base64url");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", oauthKey(), iv);
  const encrypted = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function readOAuthHandoff(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");
  if (!ivValue || !tagValue || !encryptedValue) return null;

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", oauthKey(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    const payload = Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    const parsed = JSON.parse(payload) as { expiresAt?: number; result?: Awaited<ReturnType<typeof loginWithGoogle>> };
    return parsed.expiresAt && parsed.expiresAt > Date.now() && parsed.result ? parsed.result : null;
  } catch {
    return null;
  }
}

function getGoogleConfig() {
  if (!env.googleClientId || !env.googleClientSecret || !env.googleRedirectUri) {
    throw new AppError("Google login is not configured on the server.", 503);
  }
  return { clientId: env.googleClientId, clientSecret: env.googleClientSecret, redirectUri: env.googleRedirectUri };
}

authRouter.get("/google", (_req, res) => {
  const config = getGoogleConfig();
  const state = createOAuthState();
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
    if (!isValidOAuthState(state) || !code) {
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
    const handoffCode = createOAuthHandoff(result);
    res.redirect(`${env.appBaseUrl}/#/?googleCode=${encodeURIComponent(handoffCode)}`);
  }),
);

authRouter.post("/google/exchange", (req, res) => {
  const code = typeof req.body?.code === "string" ? req.body.code : "";
  const result = readOAuthHandoff(code);
  if (!result) {
    throw new AppError("Google login session expired. Please try again.", 400);
  }
  res.json(result);
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
