import { randomBytes, createHash } from "node:crypto";

/** 64 bytes of randomness, hex-encoded → 128 chars. */
export function generateRefreshToken(): string {
  return randomBytes(64).toString("hex");
}

/** SHA-256 of the raw token. Never store the raw token. */
export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
