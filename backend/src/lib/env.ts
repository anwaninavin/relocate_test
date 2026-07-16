import { z } from "zod";

/** Required env vars validated once at process startup instead of being read lazily wherever
 * they're used (JWT_SECRET in lib/jwt.ts, MONGODB_URI in db.ts, IP_HASH_SALT in lib/geo.ts).
 * Lazy reads let the server boot successfully and pass health checks with a missing secret,
 * then fail confusingly on the first request that happens to touch it — this fails loudly at
 * boot instead, before the process ever starts accepting traffic. */
const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  // Salts the HMAC used to hash visitor IPs for analytics (lib/geo.ts) — must never fall back
  // to a hardcoded value, since a known fallback would let anyone confirm whether a given IP
  // appears in analytics data, defeating the point of hashing it in the first place.
  IP_HASH_SALT: z.string().min(1, "IP_HASH_SALT is required"),
  // AES-256-GCM key (64 hex chars = 32 bytes) used to encrypt User.waLoginPin at rest —
  // see lib/pinEncryption.ts. Generate with: openssl rand -hex 32
  PIN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[a-f0-9]{64}$/i, "PIN_ENCRYPTION_KEY must be a 64-character hex string (openssl rand -hex 32)"),
});

export function assertRequiredEnv(): void {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    console.error(`Missing required environment variable(s): ${missing}. See backend/.env.example.`);
    process.exit(1);
  }
}
