import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = "30d";

/** `tv` (tokenVersion) lets a previously-issued token be invalidated server-side without
 * waiting for its 30-day expiry — see User.tokenVersion for when it's bumped. Required (not
 * defaulted) here so every call site has to look up the user's current value rather than
 * silently signing a token that's already stale. */
export function signAuthToken(userId: string, tokenVersion: number): string {
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return jwt.sign({ sub: userId, tv: tokenVersion }, JWT_SECRET, { expiresIn: TOKEN_TTL, algorithm: "HS256" });
}

export function verifyAuthToken(token: string): { sub: string; tv?: number } {
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable");
  }
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as { sub: string; tv?: number };
}
