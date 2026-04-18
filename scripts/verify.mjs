#!/usr/bin/env node
/**
 * End-to-end verification harness.
 *
 * Exercises the REAL domain, crypto, and QR layers to prove the complete
 * Casino Money flow works without needing a browser. Runs 20+ scenarios
 * covering happy paths, every anti-fraud check, and code-encoding quirks.
 *
 * Run with:  npm run verify
 */
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const here = new URL(".", import.meta.url).pathname;
const scriptPath = resolve(here, "verify.test.ts");

const result = spawnSync(
  "npx",
  ["vitest", "run", "--reporter=verbose", scriptPath],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);
process.exit(result.status ?? 1);
