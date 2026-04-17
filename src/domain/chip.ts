import { uuid } from "@/crypto/random";
import { canonicalBytes } from "@/crypto/serialize";
import { sign, verify } from "@/crypto/signatures";
import { base64UrlToBytes, bytesToBase64Url } from "@/crypto/encoding";
import type {
  Chip,
  ChipBody,
  DealerId,
  PlayerId,
  SessionId,
  VerifyResult,
  WalletChip,
} from "./types";
import type { Denomination } from "./denominations";
import { verifyEndorsementChain } from "./endorsement";

export type IssueChipInput = {
  denom: Denomination;
  sessionId: SessionId;
  dealerId: DealerId;
  issuedTo: PlayerId;
  dealerSecretKey: Uint8Array;
};

export function issueChip(input: IssueChipInput): Chip {
  const body: ChipBody = {
    serial: uuid(),
    denom: input.denom,
    sessionId: input.sessionId,
    dealerId: input.dealerId,
    issuedTo: input.issuedTo,
    issuedAt: Date.now(),
  };
  const sig = sign(canonicalBytes(body), input.dealerSecretKey);
  return { ...body, sig: bytesToBase64Url(sig) };
}

/** Verify only the dealer signature on a raw Chip (no endorsements). */
export function verifyChipSignature(chip: Chip, dealerPubKey: Uint8Array): boolean {
  const { sig, ...body } = chip;
  return verify(base64UrlToBytes(sig), canonicalBytes(body), dealerPubKey);
}

/** Full verification for a chip as it sits in a player's wallet. */
export function verifyWalletChip(
  wc: WalletChip,
  ctx: { dealerPubKey: Uint8Array; sessionId: SessionId; expectedOwner: PlayerId },
): VerifyResult {
  if (wc.chip.sessionId !== ctx.sessionId) {
    return { ok: false, reason: "wrong-session" };
  }
  if (!verifyChipSignature(wc.chip, ctx.dealerPubKey)) {
    return { ok: false, reason: "bad-dealer-signature" };
  }
  const chainResult = verifyEndorsementChain(wc);
  if (!chainResult.ok) return chainResult;
  const currentOwner = currentHolder(wc);
  if (currentOwner !== ctx.expectedOwner) {
    return { ok: false, reason: "not-owned-by-player" };
  }
  return { ok: true };
}

/** Verification at the dealer's redeem step: stricter — checks dealerId match too. */
export function verifyForRedeem(
  wc: WalletChip,
  ctx: { dealerPubKey: Uint8Array; sessionId: SessionId; myDealerId: DealerId },
): VerifyResult {
  if (wc.chip.sessionId !== ctx.sessionId) {
    return { ok: false, reason: "wrong-session" };
  }
  if (wc.chip.dealerId !== ctx.myDealerId) {
    return { ok: false, reason: "wrong-dealer-for-redeem" };
  }
  if (!verifyChipSignature(wc.chip, ctx.dealerPubKey)) {
    return { ok: false, reason: "bad-dealer-signature" };
  }
  const chainResult = verifyEndorsementChain(wc);
  if (!chainResult.ok) return chainResult;
  return { ok: true };
}

/** The player currently entitled to the chip — last endorsement's `to`, or the original recipient. */
export function currentHolder(wc: WalletChip): PlayerId {
  if (wc.endorsements.length === 0) return wc.chip.issuedTo;
  return wc.endorsements[wc.endorsements.length - 1].to;
}

/** Total face value of a wallet chip list. */
export function sumChips(chips: WalletChip[]): number {
  return chips.reduce((acc, wc) => acc + wc.chip.denom, 0);
}
