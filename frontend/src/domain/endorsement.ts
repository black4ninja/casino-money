import { canonicalBytes } from "@/crypto/serialize";
import { sign, verify } from "@/crypto/signatures";
import { base64UrlToBytes, bytesToBase64Url } from "@/crypto/encoding";
import type {
  Endorsement,
  EndorsementBody,
  PlayerId,
  VerifyResult,
  WalletChip,
} from "./types";

export type EndorseInput = {
  wc: WalletChip;
  from: PlayerId;
  to: PlayerId;
  fromSecretKey: Uint8Array;
};

export function endorseChip(input: EndorseInput): WalletChip {
  const body: EndorsementBody = {
    serial: input.wc.chip.serial,
    from: input.from,
    to: input.to,
    at: Date.now(),
  };
  const sig = sign(canonicalBytes(body), input.fromSecretKey);
  const endorsement: Endorsement = { ...body, sig: bytesToBase64Url(sig) };
  return {
    chip: input.wc.chip,
    endorsements: [...input.wc.endorsements, endorsement],
  };
}

export function verifyEndorsementChain(wc: WalletChip): VerifyResult {
  let expectedFrom: PlayerId = wc.chip.issuedTo;
  for (const e of wc.endorsements) {
    if (e.from !== expectedFrom) {
      return { ok: false, reason: "broken-endorsement-chain" };
    }
    if (e.serial !== wc.chip.serial) {
      return { ok: false, reason: "broken-endorsement-chain" };
    }
    expectedFrom = e.to;
  }
  return { ok: true };
}

/**
 * Verify that each endorsement's signature is valid. Needs a resolver from playerId to
 * pubKey, because endorsements are signed by players (not the dealer). In practice the
 * receiving dealer or peer includes the pubKey in the transfer payload alongside the
 * wallet chips so verification is self-contained.
 */
export function verifyEndorsementSignatures(
  wc: WalletChip,
  pubKeyByPlayerId: Record<PlayerId, Uint8Array>,
): VerifyResult {
  for (const e of wc.endorsements) {
    const pub = pubKeyByPlayerId[e.from];
    if (!pub) {
      return { ok: false, reason: "bad-endorsement-signature" };
    }
    const { sig, ...body } = e;
    const ok = verify(base64UrlToBytes(sig), canonicalBytes(body), pub);
    if (!ok) return { ok: false, reason: "bad-endorsement-signature" };
  }
  return { ok: true };
}
