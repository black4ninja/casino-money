import type { AnyQR } from "./schemas";
import { isValidQR } from "./schemas";

/**
 * QR payloads are compact JSON prefixed with a short magic string.
 * We could compress with pako, but Ed25519 signatures and UUIDs dominate the size
 * and don't compress well — keeping it JSON makes debugging much easier for teachers
 * and students poking around. Typical payload fits within a QR Version 20-ish.
 */
const MAGIC = "cm1:";

export function encodeQR(payload: AnyQR): string {
  return MAGIC + JSON.stringify(payload);
}

export type DecodeResult =
  | { ok: true; payload: AnyQR }
  | { ok: false; error: string };

export function decodeQR(raw: string): DecodeResult {
  if (!raw.startsWith(MAGIC)) {
    return { ok: false, error: "Este QR no pertenece a Casino Money." };
  }
  try {
    const parsed = JSON.parse(raw.slice(MAGIC.length)) as unknown;
    if (!isValidQR(parsed)) {
      return { ok: false, error: "Formato de QR no reconocido." };
    }
    return { ok: true, payload: parsed };
  } catch {
    return { ok: false, error: "El QR está dañado o incompleto." };
  }
}
