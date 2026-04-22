import { bytesToHex } from "./encoding";

/** UUID v4 using crypto.getRandomValues (available in all modern browsers + jsdom). */
export function uuid(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytesToHex(bytes);
  return (
    hex.substring(0, 8) +
    "-" +
    hex.substring(8, 12) +
    "-" +
    hex.substring(12, 16) +
    "-" +
    hex.substring(16, 20) +
    "-" +
    hex.substring(20, 32)
  );
}

/**
 * Unbiased random integer in `[min, max]` inclusive.
 * Uses `crypto.getRandomValues` with rejection sampling so that values at the
 * edges of the modulo bucket aren't over-represented. Good enough for UI-level
 * randomness (roulette, shuffles) — not a DRBG.
 */
export function randomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError("randomInt requires integers with min ≤ max");
  }
  const range = max - min + 1;
  if (range === 1) return min;
  const maxAcceptable = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    const x = buf[0]!;
    if (x < maxAcceptable) return min + (x % range);
  }
}

/** Random float in [min, max). Uniform across the interval. */
export function randomFloat(min: number, max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const unit = buf[0]! / 0x100000000;
  return min + unit * (max - min);
}

/** Random salt for key derivation (16 bytes, base64url). */
export function randomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64url without padding
  let b = "";
  for (const x of bytes) b += String.fromCharCode(x);
  return btoa(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
