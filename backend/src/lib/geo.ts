import crypto from "node:crypto";

import geoip from "geoip-lite";
import type { Request } from "express";

// No hardcoded fallback — assertRequiredEnv() (called at process startup, see index.ts)
// guarantees this is set before any request handler can reach hashIp().
const IP_HASH_SALT = process.env.IP_HASH_SALT as string;

/** One-way, salted hash of an IP — never store or log the raw address. Deterministic per IP
 * so repeat visits from the same address can still be correlated without recovering it. */
export function hashIp(ip: string): string {
  return crypto.createHmac("sha256", IP_HASH_SALT).update(ip).digest("hex");
}

/** Best-effort client IP behind Render's proxy — first hop of X-Forwarded-For, falling back
 * to the socket address. Render (and most PaaS) always sets this. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (first ?? req.socket.remoteAddress ?? "0.0.0.0").trim();
}

export interface GeoInfo {
  country: string | null;
  state: string | null;
  city: string | null;
}

/** Local (offline) IP → geo lookup — no outbound calls, no third-party geolocation service.
 * Private/loopback ranges and lookup misses resolve to nulls rather than throwing. */
export function lookupGeo(ip: string): GeoInfo {
  const result = geoip.lookup(ip);
  if (!result) {
    return { country: null, state: null, city: null };
  }
  return {
    country: result.country || null,
    state: result.region || null,
    city: result.city || null,
  };
}
