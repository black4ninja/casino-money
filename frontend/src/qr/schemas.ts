import type {
  Chip,
  DealerId,
  PlayerIdentity,
  Session,
  SessionId,
  WalletChip,
} from "@/domain/types";

/**
 * All QR payloads are JSON objects tagged with a `type` and a `v` (schema version).
 * This lets the scanner dispatch deterministically and makes future migrations safe.
 */
export const QR_VERSION = 1;

export type SessionQR = {
  v: typeof QR_VERSION;
  type: "session";
  session: Session;
};

export type IdentityQR = {
  v: typeof QR_VERSION;
  type: "identity";
  identity: PlayerIdentity;
};

export type ChipsQR = {
  v: typeof QR_VERSION;
  type: "chips";
  sessionId: SessionId;
  dealerId: DealerId;
  toPlayerId: string;
  chips: Chip[];
};

export type RedeemQR = {
  v: typeof QR_VERSION;
  type: "redeem";
  /** Chips with their full endorsement chains. */
  walletChips: WalletChip[];
  /** Public keys for every player that appears as `from` in any endorsement. */
  pubKeys: Record<string, string>;
};

export type TransferQR = {
  v: typeof QR_VERSION;
  type: "transfer";
  fromPlayerId: string;
  fromAlias: string;
  fromPubKey: string;
  /** Chips with the new endorsement appended by the sender. */
  walletChips: WalletChip[];
  /** Chain pubkeys so receiver can verify older endorsements too. */
  pubKeys: Record<string, string>;
};

export type ReceiptQR = {
  v: typeof QR_VERSION;
  type: "receipt";
  sessionId: SessionId;
  dealerId: DealerId;
  spentSerials: string[];
  at: number;
};

/** Dealer pushes its stats to the admin via this payload. */
export type DealerStatsQR = {
  v: typeof QR_VERSION;
  type: "dealer-stats";
  sessionId: SessionId;
  dealerId: DealerId;
  issuedCount: number;
  issuedAmount: number;
  redeemedCount: number;
  redeemedAmount: number;
  uniquePlayers: string[];
};

/**
 * Welcome kit: a pre-assembled bundle that hands a student a complete,
 * ready-to-play profile (identity + keypair + welcome chips) in one scan/link.
 * The teacher generates these in batch from the Roster page and distributes
 * via WhatsApp or printed QR. Whoever opens the link effectively BECOMES that
 * student — treat the link as private, like a login credential.
 */
export type WelcomeKitQR = {
  v: typeof QR_VERSION;
  type: "welcome-kit";
  session: Session;
  alias: string;
  /** Base64url-encoded 32-byte Ed25519 secret key. */
  secretKey: string;
  /** Derived playerId, included so the chip issuedTo is verifiable offline. */
  playerId: string;
  /** Base64url-encoded pubkey — convenience so the player app skips derivation. */
  pubKey: string;
  /** Pre-signed chips distributed across the session's mesas. */
  chips: Chip[];
};

export type AnyQR =
  | SessionQR
  | IdentityQR
  | ChipsQR
  | RedeemQR
  | TransferQR
  | ReceiptQR
  | DealerStatsQR
  | WelcomeKitQR;

/** Narrow an unknown parsed payload. */
export function isValidQR(value: unknown): value is AnyQR {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (obj.v !== QR_VERSION) return false;
  return (
    obj.type === "session" ||
    obj.type === "identity" ||
    obj.type === "chips" ||
    obj.type === "redeem" ||
    obj.type === "transfer" ||
    obj.type === "receipt" ||
    obj.type === "dealer-stats" ||
    obj.type === "welcome-kit"
  );
}
