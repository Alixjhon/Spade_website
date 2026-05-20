import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/appError.js";
import { verifyAuthToken } from "../lib/authToken.js";

const OFFICER_ROLES = new Set([
  "Admin",
  "president",
  "vice-president",
  "secretary",
  "asst-secretary",
  "treasurer",
  "pio",
]);

export type AuthenticatedRequest = Request & {
  user?: {
    email: string;
    role: string;
    name: string;
  };
};

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = authHeader.substring(7);
  const payload = verifyAuthToken(token);
  if (!payload) {
    throw new AppError("Invalid authentication token.", 401);
  }

  (req as AuthenticatedRequest).user = {
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.role !== "president") {
      throw new AppError("President access required.", 403);
    }

    next();
  });
}

export function requirePresident(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.role !== "president") {
      throw new AppError("Only the president can assign project activities.", 403);
    }

    next();
  });
}

export function requireOfficer(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    const user = (req as AuthenticatedRequest).user;
    if (!user || !OFFICER_ROLES.has(user.role)) {
      throw new AppError("Officer access required.", 403);
    }

    next();
  });
}

export function getAuthenticatedUser(req: Request) {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    throw new AppError("Authentication required.", 401);
  }

  return user;
}
