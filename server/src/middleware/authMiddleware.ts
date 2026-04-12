import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = authHeader.substring(7);
  if (token !== env.defaultPassword) {
    throw new AppError("Invalid authentication token.", 401);
  }

  // Attach user info to request
  (req as any).user = { email: "admin@spade.com" };
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Authentication required.", 401);
  }

  const token = authHeader.substring(7);
  if (token !== env.defaultPassword) {
    throw new AppError("Invalid authentication token.", 401);
  }

  // In a real app, we would check user role from database
  // For now, we'll assume the default password is for admin
  next();
}