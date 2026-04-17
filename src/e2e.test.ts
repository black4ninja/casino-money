import { describe, it, expect, beforeEach } from "vitest";
import { deriveKeypairFromPassword } from "@/crypto/keys";
import { bytesToBase64Url, base64UrlToBytes } from "@/crypto/encoding";
import { randomSalt, uuid } from "@/crypto/random";
import { createPlayerAccount } from "@/domain/player";
import {
  issueChip,
  verifyWalletChip,
  verifyForRedeem,
  sumChips,
} from "@/domain/chip";
import {
  endorseChip,
  verifyEndorsementSignatures,
  verifyEndorsementChain,
} from "@/domain/endorsement";
import type { Session, WalletChip } from "@/domain/types";
import { loadLedger, recordRedeemed, isSpent, recordIssued } from "@/storage/dealer";
import { saveWalletChips, loadWalletChips } from "@/storage/wallet";
import { saveSession, loadSession } from "@/storage/session";

const CHEAP_ITERATIONS = 1000;

function setupSession(label = "Test Casino") {
  const password = "super-secret-pwd-42";
  const salt = randomSalt();
  const kp = deriveKeypairFromPassword(password, salt, CHEAP_ITERATIONS);
  const session: Session = {
    sessionId: uuid(),
    dealerPubKey: bytesToBase64Url(kp.publicKey),
    salt,
    label,
    startedAt: Date.now(),
  };
  return { password, session, keypair: kp };
}

describe("End-to-end casino flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("admin → dealer → player → dealer redeem golden path", () => {
    const { session, keypair } = setupSession();
    saveSession(session);
    expect(loadSession()?.sessionId).toBe(session.sessionId);

    const player = createPlayerAccount("Ana");
    const dealerId = "Mesa-1";

    // Dealer issues 2x100 + 1x50 = $250
    const chips = [100, 100, 50].map((d) =>
      issueChip({
        denom: d as 50 | 100,
        sessionId: session.sessionId,
        dealerId,
        issuedTo: player.identity.playerId,
        dealerSecretKey: keypair.secretKey,
      }),
    );
    const dealerPubKey = base64UrlToBytes(session.dealerPubKey);

    // Player receives: each chip verifies and goes into the wallet.
    const walletChips: WalletChip[] = chips.map((chip) => ({
      chip,
      endorsements: [],
    }));
    for (const wc of walletChips) {
      const v = verifyWalletChip(wc, {
        dealerPubKey,
        sessionId: session.sessionId,
        expectedOwner: player.identity.playerId,
      });
      expect(v.ok).toBe(true);
    }
    saveWalletChips(session.sessionId, walletChips);

    expect(sumChips(loadWalletChips(session.sessionId))).toBe(250);

    // Player pays 200 back at Mesa-1. Dealer redeems.
    let ledger = loadLedger(session.sessionId, dealerId);
    ledger = recordIssued(
      ledger,
      chips.map((c) => ({
        serial: c.serial,
        denom: c.denom,
        issuedTo: c.issuedTo,
        at: c.issuedAt,
      })),
    );
    const [pay1, pay2] = walletChips; // 100 + 100
    for (const wc of [pay1, pay2]) {
      const v = verifyForRedeem(wc, {
        dealerPubKey,
        sessionId: session.sessionId,
        myDealerId: dealerId,
      });
      expect(v.ok).toBe(true);
    }
    ledger = recordRedeemed(ledger, [pay1, pay2].map((wc) => ({
      serial: wc.chip.serial,
      denom: wc.chip.denom,
      fromPlayer: player.identity.playerId,
      at: Date.now(),
      hops: 0,
    })));
    expect(isSpent(ledger, pay1.chip.serial)).toBe(true);
    expect(isSpent(ledger, pay2.chip.serial)).toBe(true);
  });

  it("rejects double-redeem of the same chip", () => {
    const { session, keypair } = setupSession();
    const player = createPlayerAccount("Beto");
    const chip = issueChip({
      denom: 500,
      sessionId: session.sessionId,
      dealerId: "Mesa-2",
      issuedTo: player.identity.playerId,
      dealerSecretKey: keypair.secretKey,
    });
    const wc: WalletChip = { chip, endorsements: [] };
    let ledger = loadLedger(session.sessionId, "Mesa-2");
    ledger = recordRedeemed(ledger, [
      {
        serial: chip.serial,
        denom: chip.denom,
        fromPlayer: player.identity.playerId,
        at: Date.now(),
        hops: 0,
      },
    ]);
    // Player tries to redeem again — dealer detects it's already spent.
    expect(isSpent(ledger, wc.chip.serial)).toBe(true);
  });

  it("rejects chips presented at the wrong mesa", () => {
    const { session, keypair } = setupSession();
    const player = createPlayerAccount("Carla");
    const chip = issueChip({
      denom: 1000,
      sessionId: session.sessionId,
      dealerId: "Mesa-3",
      issuedTo: player.identity.playerId,
      dealerSecretKey: keypair.secretKey,
    });
    const wc: WalletChip = { chip, endorsements: [] };
    const dealerPubKey = base64UrlToBytes(session.dealerPubKey);
    const v = verifyForRedeem(wc, {
      dealerPubKey,
      sessionId: session.sessionId,
      myDealerId: "Mesa-4",
    });
    expect(v).toEqual({ ok: false, reason: "wrong-dealer-for-redeem" });
  });

  it("detects tampering with denomination in localStorage", () => {
    const { session, keypair } = setupSession();
    const player = createPlayerAccount("Diego");
    const chip = issueChip({
      denom: 10,
      sessionId: session.sessionId,
      dealerId: "Mesa-1",
      issuedTo: player.identity.playerId,
      dealerSecretKey: keypair.secretKey,
    });
    const tampered: WalletChip = {
      chip: { ...chip, denom: 1000 }, // greedy player edits localStorage
      endorsements: [],
    };
    const dealerPubKey = base64UrlToBytes(session.dealerPubKey);
    const v = verifyWalletChip(tampered, {
      dealerPubKey,
      sessionId: session.sessionId,
      expectedOwner: player.identity.playerId,
    });
    expect(v).toEqual({ ok: false, reason: "bad-dealer-signature" });
  });

  it("P2P transfer chain A→B→C is verifiable", () => {
    const { session, keypair } = setupSession();
    const ana = createPlayerAccount("Ana");
    const beto = createPlayerAccount("Beto");
    const carlos = createPlayerAccount("Carlos");

    const chip = issueChip({
      denom: 100,
      sessionId: session.sessionId,
      dealerId: "Mesa-1",
      issuedTo: ana.identity.playerId,
      dealerSecretKey: keypair.secretKey,
    });
    const wc0: WalletChip = { chip, endorsements: [] };

    const wc1 = endorseChip({
      wc: wc0,
      from: ana.identity.playerId,
      to: beto.identity.playerId,
      fromSecretKey: base64UrlToBytes(ana.secretKey),
    });
    const wc2 = endorseChip({
      wc: wc1,
      from: beto.identity.playerId,
      to: carlos.identity.playerId,
      fromSecretKey: base64UrlToBytes(beto.secretKey),
    });

    const dealerPubKey = base64UrlToBytes(session.dealerPubKey);
    const pubMap = {
      [ana.identity.playerId]: base64UrlToBytes(ana.identity.pubKey),
      [beto.identity.playerId]: base64UrlToBytes(beto.identity.pubKey),
    };
    expect(verifyEndorsementChain(wc2)).toEqual({ ok: true });
    expect(verifyEndorsementSignatures(wc2, pubMap)).toEqual({ ok: true });
    expect(
      verifyWalletChip(wc2, {
        dealerPubKey,
        sessionId: session.sessionId,
        expectedOwner: carlos.identity.playerId,
      }),
    ).toEqual({ ok: true });
    // Carlos can redeem at Mesa-1 (original dealer).
    expect(
      verifyForRedeem(wc2, {
        dealerPubKey,
        sessionId: session.sessionId,
        myDealerId: "Mesa-1",
      }),
    ).toEqual({ ok: true });
  });

  it("dealer rejects transfer at a non-emitting mesa (chip not fungible)", () => {
    const { session, keypair } = setupSession();
    const ana = createPlayerAccount("Ana");
    const beto = createPlayerAccount("Beto");
    const chip = issueChip({
      denom: 100,
      sessionId: session.sessionId,
      dealerId: "Mesa-1",
      issuedTo: ana.identity.playerId,
      dealerSecretKey: keypair.secretKey,
    });
    const wc0: WalletChip = { chip, endorsements: [] };
    const wc1 = endorseChip({
      wc: wc0,
      from: ana.identity.playerId,
      to: beto.identity.playerId,
      fromSecretKey: base64UrlToBytes(ana.secretKey),
    });
    const dealerPubKey = base64UrlToBytes(session.dealerPubKey);
    // Beto tries to cash at Mesa-2 — should be rejected.
    expect(
      verifyForRedeem(wc1, {
        dealerPubKey,
        sessionId: session.sessionId,
        myDealerId: "Mesa-2",
      }),
    ).toEqual({ ok: false, reason: "wrong-dealer-for-redeem" });
  });

  it("dealer password must produce the same pubkey as stored in session", () => {
    const { password, session } = setupSession();
    // Correct password recovers the key.
    const recovered = deriveKeypairFromPassword(
      password,
      session.salt,
      CHEAP_ITERATIONS,
    );
    expect(bytesToBase64Url(recovered.publicKey)).toBe(session.dealerPubKey);
    // Wrong password yields a different key.
    const wrong = deriveKeypairFromPassword(
      "wrong-password",
      session.salt,
      CHEAP_ITERATIONS,
    );
    expect(bytesToBase64Url(wrong.publicKey)).not.toBe(session.dealerPubKey);
  });
});
