import type { Denomination } from "./denominations";

export type PlayerId = string;
export type DealerId = string;
export type SessionId = string;
export type Serial = string;

/** Public information about a running casino session. Shared via QR. */
export type Session = {
  sessionId: SessionId;
  /** Base64url-encoded dealer public key. */
  dealerPubKey: string;
  /** Public salt used for PBKDF2 derivation. */
  salt: string;
  /** ISO label that the teacher chose (e.g., "Casino Primavera 2026"). */
  label: string;
  startedAt: number;
  /** Optional list of mesa IDs the teacher pre-announces. */
  mesas?: string[];
};

/** Identity a player exposes to a dealer via QR. */
export type PlayerIdentity = {
  playerId: PlayerId;
  /** Base64url-encoded player public key. */
  pubKey: string;
  alias: string;
};

/** Core signed chip — this is the money. */
export type Chip = {
  serial: Serial;
  denom: Denomination;
  sessionId: SessionId;
  dealerId: DealerId;
  issuedTo: PlayerId;
  issuedAt: number;
  /** Base64url Ed25519 signature over the canonical chip body (all fields except sig). */
  sig: string;
};

export type ChipBody = Omit<Chip, "sig">;

/** An endorsement transfers custody from one player to the next. */
export type Endorsement = {
  serial: Serial;
  from: PlayerId;
  to: PlayerId;
  at: number;
  /** Base64url Ed25519 signature by `from` over the canonical endorsement body. */
  sig: string;
};

export type EndorsementBody = Omit<Endorsement, "sig">;

/** A chip as it lives in a player's wallet: the original + a possibly-empty chain. */
export type WalletChip = {
  chip: Chip;
  endorsements: Endorsement[];
};

/** Reason a wallet chip failed verification. */
export type ChipVerificationFailure =
  | "bad-dealer-signature"
  | "wrong-session"
  | "broken-endorsement-chain"
  | "bad-endorsement-signature"
  | "not-owned-by-player"
  | "wrong-dealer-for-redeem"
  | "already-spent";

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: ChipVerificationFailure };

/** Dealer-side ledger entry: we recorded a chip we emitted. */
export type IssuedRecord = {
  serial: Serial;
  denom: Denomination;
  issuedTo: PlayerId;
  alias?: string;
  at: number;
};

/** Dealer-side ledger entry: we redeemed (spent) a chip. */
export type RedeemedRecord = {
  serial: Serial;
  denom: Denomination;
  fromPlayer: PlayerId;
  alias?: string;
  at: number;
  /** Last endorsement chain length — 0 means player cashed directly. */
  hops: number;
};

/** Player history entry. */
export type HistoryEntry =
  | {
      kind: "receive";
      serial: Serial;
      denom: Denomination;
      from: DealerId;
      at: number;
    }
  | {
      kind: "redeem";
      serial: Serial;
      denom: Denomination;
      to: DealerId;
      at: number;
    }
  | {
      kind: "transfer-out";
      serial: Serial;
      denom: Denomination;
      to: PlayerId;
      alias?: string;
      at: number;
    }
  | {
      kind: "transfer-in";
      serial: Serial;
      denom: Denomination;
      from: PlayerId;
      alias?: string;
      at: number;
    };
