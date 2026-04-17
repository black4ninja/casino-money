import { describe, it, expect } from "vitest";
import { encodeQR, decodeQR } from "./codec";
import { QR_VERSION, type IdentityQR } from "./schemas";

describe("QR codec", () => {
  it("round-trips an identity payload", () => {
    const original: IdentityQR = {
      v: QR_VERSION,
      type: "identity",
      identity: { playerId: "abc", pubKey: "pk", alias: "Ana" },
    };
    const encoded = encodeQR(original);
    const decoded = decodeQR(encoded);
    expect(decoded).toEqual({ ok: true, payload: original });
  });

  it("rejects unknown prefix", () => {
    const bad = decodeQR("https://example.com");
    expect(bad.ok).toBe(false);
  });

  it("rejects malformed JSON", () => {
    const bad = decodeQR("cm1:{not-json");
    expect(bad.ok).toBe(false);
  });

  it("rejects unknown type", () => {
    const bad = decodeQR('cm1:{"v":1,"type":"mystery"}');
    expect(bad.ok).toBe(false);
  });
});
