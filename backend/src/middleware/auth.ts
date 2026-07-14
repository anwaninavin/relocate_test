import type { NextFunction, Request, Response } from "express";

import { connectDB } from "@/db";
import { User, type UserDocument } from "@/models/User";
import { verifyAuthToken } from "@/lib/jwt";
import type { HydratedDocument } from "mongoose";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: HydratedDocument<UserDocument>;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    await connectDB();
    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Not authenticated" });
  }
}

/** Resolves req.user from a bearer token when present and valid, but never rejects the
 * request — used by public endpoints (like analytics event collection) that need to know
 * "who, if anyone, is logged in" without requiring a session. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAuthToken(token);
    await connectDB();
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch {
    // Invalid/expired token on a public endpoint — just proceed anonymously.
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  next();
}
