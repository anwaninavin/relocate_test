import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

const PIN_LENGTH = 7;
const SHORT_PIN_LENGTH = 4;
const BCRYPT_ROUNDS = 10;

/** A random 7-digit numeric login code, e.g. "0453981". */
export function generatePin(): string {
  const min = 10 ** (PIN_LENGTH - 1);
  const max = 10 ** PIN_LENGTH;
  return randomInt(min, max).toString();
}

/** A random 4-digit numeric login code, e.g. "4917" — used to reissue a /wa-login account's
 * code over WhatsApp when they message in for a mobile number that's already registered. */
export function generateShortPin(): string {
  const min = 10 ** (SHORT_PIN_LENGTH - 1);
  const max = 10 ** SHORT_PIN_LENGTH;
  return randomInt(min, max).toString();
}

export function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, BCRYPT_ROUNDS);
}

export function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
