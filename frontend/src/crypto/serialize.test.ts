import { describe, it, expect } from "vitest";
import { canonicalize } from "./serialize";

describe("canonicalize", () => {
  it("sorts keys alphabetically", () => {
    expect(canonicalize({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("sorts keys deeply", () => {
    expect(canonicalize({ outer: { z: 1, a: 2 } })).toBe(
      '{"outer":{"a":2,"z":1}}',
    );
  });

  it("preserves array order", () => {
    expect(canonicalize([3, 1, 2])).toBe("[3,1,2]");
  });

  it("is byte-identical regardless of input key order", () => {
    const a = canonicalize({ denom: 100, serial: "x", sig: "y" });
    const b = canonicalize({ sig: "y", serial: "x", denom: 100 });
    expect(a).toBe(b);
  });

  it("handles primitives", () => {
    expect(canonicalize(null)).toBe("null");
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize("hi")).toBe('"hi"');
  });
});
