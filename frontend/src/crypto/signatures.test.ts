import { describe, it, expect } from "vitest";
import { generateKeypair, sign, verify, keypairFromSecret } from "./signatures";
import { canonicalBytes } from "./serialize";

describe("signatures", () => {
  it("round-trips sign/verify on canonical JSON", () => {
    const kp = generateKeypair();
    const msg = canonicalBytes({ b: 2, a: 1, nested: { y: 1, x: 0 } });
    const sig = sign(msg, kp.secretKey);
    expect(verify(sig, msg, kp.publicKey)).toBe(true);
  });

  it("rejects tampered message", () => {
    const kp = generateKeypair();
    const msg = canonicalBytes({ amount: 100 });
    const sig = sign(msg, kp.secretKey);
    const tampered = canonicalBytes({ amount: 100000 });
    expect(verify(sig, tampered, kp.publicKey)).toBe(false);
  });

  it("rejects signature from different key", () => {
    const a = generateKeypair();
    const b = generateKeypair();
    const msg = canonicalBytes({ x: 1 });
    const sig = sign(msg, a.secretKey);
    expect(verify(sig, msg, b.publicKey)).toBe(false);
  });

  it("keypairFromSecret is deterministic", () => {
    const secret = new Uint8Array(32).fill(7);
    const kp1 = keypairFromSecret(secret);
    const kp2 = keypairFromSecret(secret);
    expect(kp1.publicKey).toEqual(kp2.publicKey);
  });
});
