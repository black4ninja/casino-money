import { describe, it, expect } from "vitest";
import { deriveKeypairFromPassword } from "./keys";

describe("deriveKeypairFromPassword", () => {
  // Use a low iteration count in tests to keep them fast; production uses 210_000.
  const CHEAP = 1000;

  it("same password + salt → same keypair", () => {
    const a = deriveKeypairFromPassword("correct-horse", "salt-1", CHEAP);
    const b = deriveKeypairFromPassword("correct-horse", "salt-1", CHEAP);
    expect(a.publicKey).toEqual(b.publicKey);
    expect(a.secretKey).toEqual(b.secretKey);
  });

  it("different password → different keypair", () => {
    const a = deriveKeypairFromPassword("aaa", "salt-1", CHEAP);
    const b = deriveKeypairFromPassword("bbb", "salt-1", CHEAP);
    expect(a.publicKey).not.toEqual(b.publicKey);
  });

  it("different salt → different keypair", () => {
    const a = deriveKeypairFromPassword("same-pw", "s1", CHEAP);
    const b = deriveKeypairFromPassword("same-pw", "s2", CHEAP);
    expect(a.publicKey).not.toEqual(b.publicKey);
  });
});
