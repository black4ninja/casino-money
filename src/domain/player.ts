import { generateKeypair } from "@/crypto/signatures";
import { bytesToBase64Url, shortId } from "@/crypto/encoding";
import type { PlayerId, PlayerIdentity } from "./types";

export type PlayerAccount = {
  identity: PlayerIdentity;
  /** Base64url-encoded 32-byte secret key. Stored in the player's own localStorage. */
  secretKey: string;
};

export function createPlayerAccount(alias: string): PlayerAccount {
  const kp = generateKeypair();
  const pubKey = bytesToBase64Url(kp.publicKey);
  const playerId: PlayerId = shortId(kp.publicKey, 12);
  return {
    identity: { playerId, pubKey, alias },
    secretKey: bytesToBase64Url(kp.secretKey),
  };
}
