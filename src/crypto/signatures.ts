import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";

// Enable synchronous Ed25519 by injecting the required sha512 primitive.
// Calling this once at module load is enough for the whole app.
ed.etc.sha512Sync = (...m: Uint8Array[]) => sha512(ed.etc.concatBytes(...m));

export type Keypair = {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
};

export function generateKeypair(): Keypair {
  const secretKey = ed.utils.randomPrivateKey();
  const publicKey = ed.getPublicKey(secretKey);
  return { publicKey, secretKey };
}

export function keypairFromSecret(secretKey: Uint8Array): Keypair {
  if (secretKey.length !== 32) {
    throw new Error("Ed25519 secret key must be 32 bytes");
  }
  const publicKey = ed.getPublicKey(secretKey);
  return { publicKey, secretKey };
}

export function sign(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  return ed.sign(message, secretKey);
}

export function verify(
  signature: Uint8Array,
  message: Uint8Array,
  publicKey: Uint8Array,
): boolean {
  try {
    return ed.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}
