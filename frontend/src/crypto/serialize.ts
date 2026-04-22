/**
 * Canonical JSON serialization: keys sorted alphabetically, no whitespace.
 * Signing depends on byte-for-byte reproducibility on both sides.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalize).join(",") + "]";
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + canonicalize(obj[k]))
      .join(",") +
    "}"
  );
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export function canonicalBytes(value: unknown): Uint8Array {
  return encoder.encode(canonicalize(value));
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return decoder.decode(bytes);
}
