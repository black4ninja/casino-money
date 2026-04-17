import "@testing-library/jest-dom/vitest";

// Polyfill crypto.getRandomValues in jsdom (Node has it natively, but ensure present).
if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error injected for tests
  globalThis.crypto = (await import("node:crypto")).webcrypto;
}
