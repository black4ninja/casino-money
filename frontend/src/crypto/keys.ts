import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha256";
import { keypairFromSecret, type Keypair } from "./signatures";

export const PBKDF2_ITERATIONS = 210_000;
const DK_LEN = 32;
const encoder = new TextEncoder();

/**
 * Derive a deterministic Ed25519 keypair from a password + salt.
 * Used for the dealer keypair shared across all tallador devices:
 * same session password + same salt → same keypair, everywhere.
 *
 * The salt is public (included in the session QR); it's there to make rainbow-table
 * attacks impractical, not to keep the key secret. Secrecy comes from the password.
 */
export function deriveKeypairFromPassword(
  password: string,
  salt: string,
  iterations: number = PBKDF2_ITERATIONS,
): Keypair {
  const pwBytes = encoder.encode(password.normalize("NFKC"));
  const saltBytes = encoder.encode("casino-money.v1:" + salt);
  const secret = pbkdf2(sha256, pwBytes, saltBytes, {
    c: iterations,
    dkLen: DK_LEN,
  });
  return keypairFromSecret(secret);
}

/** Cheap probabilistic check for password strength. UI-layer convenience only. */
export function isPasswordAcceptable(pw: string): boolean {
  return pw.length >= 8;
}
