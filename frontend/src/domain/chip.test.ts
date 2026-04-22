import { describe, it, expect } from "vitest";
import { generateKeypair } from "@/crypto/signatures";
import { bytesToBase64Url, base64UrlToBytes } from "@/crypto/encoding";
import {
  issueChip,
  verifyChipSignature,
  verifyWalletChip,
  verifyForRedeem,
  currentHolder,
  sumChips,
} from "./chip";
import { endorseChip } from "./endorsement";
import type { Chip, WalletChip } from "./types";
import { createPlayerAccount } from "./player";

function setup() {
  const dealer = generateKeypair();
  const playerA = createPlayerAccount("Ana");
  const playerB = createPlayerAccount("Beto");
  const chip = issueChip({
    denom: 100,
    sessionId: "session-1",
    dealerId: "Mesa-1",
    issuedTo: playerA.identity.playerId,
    dealerSecretKey: dealer.secretKey,
  });
  const wc: WalletChip = { chip, endorsements: [] };
  return { dealer, playerA, playerB, chip, wc };
}

describe("Chip", () => {
  it("verifies a fresh dealer-signed chip", () => {
    const { dealer, chip } = setup();
    expect(verifyChipSignature(chip, dealer.publicKey)).toBe(true);
  });

  it("detects tampering with denom", () => {
    const { dealer, chip } = setup();
    const tampered: Chip = { ...chip, denom: 1000 };
    expect(verifyChipSignature(tampered, dealer.publicKey)).toBe(false);
  });

  it("detects tampering with issuedTo", () => {
    const { dealer, chip } = setup();
    const tampered: Chip = { ...chip, issuedTo: "impostor" };
    expect(verifyChipSignature(tampered, dealer.publicKey)).toBe(false);
  });

  it("detects tampering with serial", () => {
    const { dealer, chip } = setup();
    const tampered: Chip = { ...chip, serial: "new-serial" };
    expect(verifyChipSignature(tampered, dealer.publicKey)).toBe(false);
  });

  it("rejects signature from different dealer", () => {
    const { chip } = setup();
    const attacker = generateKeypair();
    expect(verifyChipSignature(chip, attacker.publicKey)).toBe(false);
  });
});

describe("verifyWalletChip (player-side)", () => {
  it("accepts a fresh chip held by the original recipient", () => {
    const { dealer, playerA, wc } = setup();
    const result = verifyWalletChip(wc, {
      dealerPubKey: dealer.publicKey,
      sessionId: "session-1",
      expectedOwner: playerA.identity.playerId,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects when session id differs", () => {
    const { dealer, playerA, wc } = setup();
    const result = verifyWalletChip(wc, {
      dealerPubKey: dealer.publicKey,
      sessionId: "other-session",
      expectedOwner: playerA.identity.playerId,
    });
    expect(result).toEqual({ ok: false, reason: "wrong-session" });
  });

  it("rejects when a different player claims ownership", () => {
    const { dealer, playerB, wc } = setup();
    const result = verifyWalletChip(wc, {
      dealerPubKey: dealer.publicKey,
      sessionId: "session-1",
      expectedOwner: playerB.identity.playerId,
    });
    expect(result).toEqual({ ok: false, reason: "not-owned-by-player" });
  });
});

describe("verifyForRedeem (dealer-side)", () => {
  it("accepts when dealer ids match", () => {
    const { dealer, wc } = setup();
    const result = verifyForRedeem(wc, {
      dealerPubKey: dealer.publicKey,
      sessionId: "session-1",
      myDealerId: "Mesa-1",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects redemption at a different mesa", () => {
    const { dealer, wc } = setup();
    const result = verifyForRedeem(wc, {
      dealerPubKey: dealer.publicKey,
      sessionId: "session-1",
      myDealerId: "Mesa-2",
    });
    expect(result).toEqual({ ok: false, reason: "wrong-dealer-for-redeem" });
  });
});

describe("endorsement chain", () => {
  it("transfers ownership A → B", () => {
    const { wc, playerA, playerB } = setup();
    const endorsed = endorseChip({
      wc,
      from: playerA.identity.playerId,
      to: playerB.identity.playerId,
      fromSecretKey: base64UrlToBytes(playerA.secretKey),
    });
    expect(endorsed.endorsements).toHaveLength(1);
    expect(currentHolder(endorsed)).toBe(playerB.identity.playerId);
  });

  it("detects broken chain when attacker inserts a random endorsement", () => {
    const { dealer, wc, playerB } = setup();
    const impostor = createPlayerAccount("Impostor");
    // Impostor signs a valid-looking endorsement but `from` isn't the real holder.
    const endorsed = endorseChip({
      wc,
      from: impostor.identity.playerId,
      to: playerB.identity.playerId,
      fromSecretKey: base64UrlToBytes(impostor.secretKey),
    });
    const result = verifyWalletChip(endorsed, {
      dealerPubKey: dealer.publicKey,
      sessionId: "session-1",
      expectedOwner: playerB.identity.playerId,
    });
    expect(result).toEqual({ ok: false, reason: "broken-endorsement-chain" });
  });

  it("verifies long chain A → B → C", () => {
    const { dealer, wc, playerA, playerB } = setup();
    const playerC = createPlayerAccount("Carlos");
    const step1 = endorseChip({
      wc,
      from: playerA.identity.playerId,
      to: playerB.identity.playerId,
      fromSecretKey: base64UrlToBytes(playerA.secretKey),
    });
    const step2 = endorseChip({
      wc: step1,
      from: playerB.identity.playerId,
      to: playerC.identity.playerId,
      fromSecretKey: base64UrlToBytes(playerB.secretKey),
    });
    expect(currentHolder(step2)).toBe(playerC.identity.playerId);
    const result = verifyWalletChip(step2, {
      dealerPubKey: dealer.publicKey,
      sessionId: "session-1",
      expectedOwner: playerC.identity.playerId,
    });
    expect(result).toEqual({ ok: true });
  });
});

describe("sumChips", () => {
  it("returns 0 for empty list", () => {
    expect(sumChips([])).toBe(0);
  });

  it("sums denominations", () => {
    const { wc } = setup();
    const big = { ...wc, chip: { ...wc.chip, denom: 500 as const } };
    expect(sumChips([wc, big, wc])).toBe(700);
  });
});

describe("dealer pubkey encoding round-trip", () => {
  it("survives base64url round-trip", () => {
    const dealer = generateKeypair();
    const b64 = bytesToBase64Url(dealer.publicKey);
    const back = base64UrlToBytes(b64);
    expect(back).toEqual(dealer.publicKey);
  });
});
