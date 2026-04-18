import { describe, it, expect } from "vitest";
import { encodeQR, decodeQR, extractPayloadFromText } from "./codec";
import { QR_VERSION, type IdentityQR } from "./schemas";

const IDENTITY: IdentityQR = {
  v: QR_VERSION,
  type: "identity",
  identity: { playerId: "abc", pubKey: "pk", alias: "Ana" },
};

describe("QR codec (cm2 compressed)", () => {
  it("round-trips a payload through cm2", () => {
    const encoded = encodeQR(IDENTITY);
    expect(encoded.startsWith("cm2:")).toBe(true);
    const decoded = decodeQR(encoded);
    expect(decoded).toEqual({ ok: true, payload: IDENTITY });
  });

  it("still accepts legacy cm1 JSON payloads on decode", () => {
    const legacy = "cm1:" + JSON.stringify(IDENTITY);
    const decoded = decodeQR(legacy);
    expect(decoded).toEqual({ ok: true, payload: IDENTITY });
  });

  it("trims whitespace around the payload", () => {
    const encoded = encodeQR(IDENTITY);
    const decoded = decodeQR("   " + encoded + "\n");
    expect(decoded.ok).toBe(true);
  });

  it("rejects unknown prefix", () => {
    expect(decodeQR("https://example.com").ok).toBe(false);
  });

  it("rejects malformed cm2 base64", () => {
    expect(decodeQR("cm2:!!!not-base64!!!").ok).toBe(false);
  });

  it("rejects cm1 with bad JSON", () => {
    expect(decodeQR("cm1:{not-json").ok).toBe(false);
  });

  it("rejects unknown type", () => {
    const bad = encodeQR({ v: 1, type: "mystery" as never } as never);
    expect(decodeQR(bad).ok).toBe(false);
  });

  it("cm2 is shorter than cm1 for multi-chip payloads", () => {
    const chips = Array.from({ length: 5 }, (_, i) => ({
      serial: `00000000-0000-4000-8000-00000000000${i}`,
      denom: 100 as const,
      sessionId: "11111111-1111-4111-8111-111111111111",
      dealerId: "Mesa-1",
      issuedTo: "pppppppppppp",
      issuedAt: 1700000000000 + i,
      sig: "x".repeat(86),
    }));
    const payload = {
      v: QR_VERSION as 1,
      type: "chips" as const,
      sessionId: "11111111-1111-4111-8111-111111111111",
      dealerId: "Mesa-1",
      toPlayerId: "pppppppppppp",
      chips,
    };
    const cm2 = encodeQR(payload);
    const cm1 = "cm1:" + JSON.stringify(payload);
    expect(cm2.length).toBeLessThan(cm1.length);
  });
});

describe("extractPayloadFromText", () => {
  const RAW = encodeQR(IDENTITY);

  it("returns a raw cm2 code as-is", () => {
    expect(extractPayloadFromText(RAW)).toBe(RAW);
  });

  it("strips surrounding whitespace and trailing words", () => {
    expect(extractPayloadFromText(`  ${RAW}\n`)).toBe(RAW);
  });

  it("extracts from a full share URL with ?c=", () => {
    const url = `https://example.com/#/ingest?c=${encodeURIComponent(RAW)}`;
    expect(extractPayloadFromText(url)).toBe(RAW);
  });

  it("handles URL-encoded raw codes pasted alone", () => {
    const urlEncoded = encodeURIComponent(RAW);
    expect(extractPayloadFromText(urlEncoded)).toBe(RAW);
  });

  it("extracts cm2 buried in WhatsApp-style prose", () => {
    const text = `Hola! Aquí tu ficha: ${RAW} — úsala pronto.`;
    expect(extractPayloadFromText(text)).toBe(RAW);
  });

  it("returns null for unrelated text", () => {
    expect(extractPayloadFromText("hola mundo")).toBe(null);
  });

  it("accepts legacy cm1 raw payloads", () => {
    const legacy = "cm1:" + JSON.stringify(IDENTITY);
    expect(extractPayloadFromText(legacy)).toBe(legacy);
  });
});
