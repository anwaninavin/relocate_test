import type { NextFunction, Request, Response } from "express";

import { getClientIp } from "@/lib/geo";

export interface AnalyticsContext {
  visitorId: string | null;
  sessionId: string | null;
  ip: string;
  userAgent: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      analytics?: AnalyticsContext;
    }
  }
}

/** Reads the visitor/session identifiers the frontend's analytics client attaches to every
 * API request (see frontend lib/analytics/client.ts) so that server-emitted events — login,
 * registration, OTP outcomes — land in the same session timeline as the client-tracked
 * page views/clicks for that visitor, without the client having to resend full event
 * payloads for events the server already knows happened. Always succeeds; a request with no
 * headers just gets a context with null ids (e.g. a health check or a very old client). */
export function analyticsContext(req: Request, _res: Response, next: NextFunction) {
  req.analytics = {
    visitorId: (req.headers["x-visitor-id"] as string | undefined)?.slice(0, 80) || null,
    sessionId: (req.headers["x-session-id"] as string | undefined)?.slice(0, 80) || null,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] || null,
  };
  next();
}
