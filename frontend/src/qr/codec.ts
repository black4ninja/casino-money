import { deflate, inflate } from "pako";
import { base64UrlToBytes, bytesToBase64Url } from "@/crypto/encoding";
import type { AnyQR } from "./schemas";
import { isValidQR } from "./schemas";

/**
 * Payload encodings:
 *  - cm2:  deflated JSON, base64url-encoded. ~40–60% shorter than cm1 for multi-chip payloads.
 *  - cm1:  raw JSON (legacy). Still accepted on decode for backwards compatibility.
 *
 * The `cm` prefix disambiguates Casino Money payloads from any other scanned text.
 */
const V2 = "cm2:";
const V1 = "cm1:";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function encodeQR(payload: AnyQR): string {
  const json = JSON.stringify(payload);
  const bytes = deflate(encoder.encode(json), { level: 9 });
  return V2 + bytesToBase64Url(bytes);
}

export type DecodeResult =
  | { ok: true; payload: AnyQR }
  | { ok: false; error: string };

export function decodeQR(raw: string): DecodeResult {
  const cleaned = raw.trim();
  let json: string;

  if (cleaned.startsWith(V2)) {
    try {
      const bytes = base64UrlToBytes(cleaned.slice(V2.length));
      json = decoder.decode(inflate(bytes));
    } catch {
      return { ok: false, error: "El código está dañado o incompleto." };
    }
  } else if (cleaned.startsWith(V1)) {
    json = cleaned.slice(V1.length);
  } else {
    return { ok: false, error: "Este código no pertenece a Casino Money." };
  }

  try {
    const parsed = JSON.parse(json) as unknown;
    if (!isValidQR(parsed)) {
      return { ok: false, error: "Formato de código no reconocido." };
    }
    return { ok: true, payload: parsed };
  } catch {
    return { ok: false, error: "El código está dañado o incompleto." };
  }
}

/**
 * Accepts any of: raw code, URL-encoded code (`cm1%3A...`), or a full share URL with `?c=`.
 * Returns the clean `cm1:`/`cm2:` payload string, or null if nothing matches.
 */
export function extractPayloadFromText(text: string): string | null {
  const cleaned = text.trim();
  if (!cleaned) return null;

  // Case 1: already a clean payload.
  if (cleaned.startsWith(V1) || cleaned.startsWith(V2)) {
    return cleaned.split(/\s/)[0];
  }

  // Case 2: URL-encoded payload.
  if (/^cm[12]%3A/i.test(cleaned)) {
    try {
      const decoded = decodeURIComponent(cleaned);
      if (decoded.startsWith(V1) || decoded.startsWith(V2)) {
        return decoded.split(/\s/)[0];
      }
    } catch {
      // fall through
    }
  }

  // Case 3: a full URL with ?c=... or &c=...
  const paramMatch = cleaned.match(/[?&]c=([^&#\s]+)/);
  if (paramMatch) {
    try {
      const decoded = decodeURIComponent(paramMatch[1]);
      if (decoded.startsWith(V1) || decoded.startsWith(V2)) {
        return decoded;
      }
    } catch {
      // fall through
    }
  }

  // Case 4: cm2 code buried in surrounding text (e.g. WhatsApp message with prose).
  // Only cm2 is safe to extract this way — cm1 is JSON with punctuation that makes
  // boundary detection ambiguous, so we don't auto-extract it from prose.
  const buriedMatch = cleaned.match(/cm2:[A-Za-z0-9_\-]+/);
  if (buriedMatch) return buriedMatch[0];

  return null;
}
