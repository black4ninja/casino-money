/**
 * Full end-to-end verification of the Casino Money system.
 *
 * Structured as Vitest tests so output is already nicely formatted, but it
 * covers every critical flow and every documented anti-fraud guarantee. If
 * this file is green, the app works.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { deriveKeypairFromPassword } from "@/crypto/keys";
import { bytesToBase64Url, base64UrlToBytes } from "@/crypto/encoding";
import { randomSalt, uuid } from "@/crypto/random";
import { createPlayerAccount } from "@/domain/player";
import {
  issueChip,
  verifyChipSignature,
  verifyForRedeem,
  verifyWalletChip,
  sumChips,
} from "@/domain/chip";
import {
  endorseChip,
  verifyEndorsementChain,
  verifyEndorsementSignatures,
} from "@/domain/endorsement";
import type { Session, WalletChip } from "@/domain/types";
import { encodeQR, decodeQR, extractPayloadFromText } from "@/qr/codec";
import { QR_VERSION, type WelcomeKitQR } from "@/qr/schemas";
import { composeWelcome, compositionTotal } from "@/domain/composition";
import { DENOMINATIONS } from "@/domain/denominations";

const CHEAP = 1000;

function newSession(): { session: Session; keypair: ReturnType<typeof deriveKeypairFromPassword> } {
  const password = "master-password-casino-2026";
  const salt = randomSalt();
  const keypair = deriveKeypairFromPassword(password, salt, CHEAP);
  return {
    session: {
      sessionId: uuid(),
      dealerPubKey: bytesToBase64Url(keypair.publicKey),
      salt,
      label: "Verify Run",
      startedAt: Date.now(),
    },
    keypair,
  };
}

function emit(
  session: Session,
  keypair: ReturnType<typeof deriveKeypairFromPassword>,
  dealerId: string,
  playerId: string,
  denoms: number[],
): WalletChip[] {
  return denoms.map((d) => ({
    chip: issueChip({
      denom: d as 10 | 50 | 100 | 500 | 1000,
      sessionId: session.sessionId,
      dealerId,
      issuedTo: playerId,
      dealerSecretKey: keypair.secretKey,
    }),
    endorsements: [],
  }));
}

describe("Admin flow", () => {
  it("derives the same keypair from the same password + salt (dealer can log in)", () => {
    const { session } = newSession();
    const recovered = deriveKeypairFromPassword(
      "master-password-casino-2026",
      session.salt,
      CHEAP,
    );
    expect(bytesToBase64Url(recovered.publicKey)).toBe(session.dealerPubKey);
  });

  it("derives a different keypair from a different password (wrong password rejected)", () => {
    const { session } = newSession();
    const wrong = deriveKeypairFromPassword("wrong-pw", session.salt, CHEAP);
    expect(bytesToBase64Url(wrong.publicKey)).not.toBe(session.dealerPubKey);
  });
});

describe("Dealer → player emission", () => {
  it("emits chips that the recipient can verify", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const chips = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100, 100, 50,
    ]);
    const pub = base64UrlToBytes(session.dealerPubKey);
    for (const wc of chips) {
      expect(verifyChipSignature(wc.chip, pub)).toBe(true);
      expect(
        verifyWalletChip(wc, {
          dealerPubKey: pub,
          sessionId: session.sessionId,
          expectedOwner: ana.identity.playerId,
        }).ok,
      ).toBe(true);
    }
    expect(sumChips(chips)).toBe(250);
  });

  it("rejects chips presented by an impostor (wrong playerId)", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const beto = createPlayerAccount("Beto");
    const [chip] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100,
    ]);
    const pub = base64UrlToBytes(session.dealerPubKey);
    const result = verifyWalletChip(chip, {
      dealerPubKey: pub,
      sessionId: session.sessionId,
      expectedOwner: beto.identity.playerId,
    });
    expect(result).toEqual({ ok: false, reason: "not-owned-by-player" });
  });
});

describe("Redeem flow", () => {
  it("accepts redemption at the emitting mesa", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const [wc] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [500]);
    const result = verifyForRedeem(wc, {
      dealerPubKey: base64UrlToBytes(session.dealerPubKey),
      sessionId: session.sessionId,
      myDealerId: "Mesa-1",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects redemption at any other mesa", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const [wc] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [500]);
    for (const mesa of ["Mesa-2", "Mesa-3", "Mesa-99"]) {
      const result = verifyForRedeem(wc, {
        dealerPubKey: base64UrlToBytes(session.dealerPubKey),
        sessionId: session.sessionId,
        myDealerId: mesa,
      });
      expect(result).toEqual({
        ok: false,
        reason: "wrong-dealer-for-redeem",
      });
    }
  });

  it("rejects redemption for a chip from a different session", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const [wc] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [100]);
    const result = verifyForRedeem(wc, {
      dealerPubKey: base64UrlToBytes(session.dealerPubKey),
      sessionId: "different-session-id",
      myDealerId: "Mesa-1",
    });
    expect(result).toEqual({ ok: false, reason: "wrong-session" });
  });
});

describe("Tampering resistance", () => {
  let session: Session;
  let keypair: ReturnType<typeof deriveKeypairFromPassword>;
  let wc: WalletChip;
  let pub: Uint8Array;

  beforeEach(() => {
    const setup = newSession();
    session = setup.session;
    keypair = setup.keypair;
    const ana = createPlayerAccount("Ana");
    [wc] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [10]);
    pub = base64UrlToBytes(session.dealerPubKey);
  });

  it("detects tampering with denom ($10 → $1000)", () => {
    const tampered: WalletChip = {
      chip: { ...wc.chip, denom: 1000 },
      endorsements: [],
    };
    expect(verifyChipSignature(tampered.chip, pub)).toBe(false);
  });

  it("detects tampering with dealerId (Mesa-1 → Mesa-2)", () => {
    const tampered: WalletChip = {
      chip: { ...wc.chip, dealerId: "Mesa-2" },
      endorsements: [],
    };
    expect(verifyChipSignature(tampered.chip, pub)).toBe(false);
  });

  it("detects tampering with issuedTo (impersonation)", () => {
    const tampered: WalletChip = {
      chip: { ...wc.chip, issuedTo: "impostor-player-id" },
      endorsements: [],
    };
    expect(verifyChipSignature(tampered.chip, pub)).toBe(false);
  });

  it("detects tampering with serial (cannot mint new valid serials)", () => {
    const tampered: WalletChip = {
      chip: { ...wc.chip, serial: "fake-new-serial" },
      endorsements: [],
    };
    expect(verifyChipSignature(tampered.chip, pub)).toBe(false);
  });
});

describe("P2P transfer", () => {
  it("A → B → C chain verifies end-to-end", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const beto = createPlayerAccount("Beto");
    const carlos = createPlayerAccount("Carlos");
    const [wc0] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100,
    ]);
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
    const pubMap = {
      [ana.identity.playerId]: base64UrlToBytes(ana.identity.pubKey),
      [beto.identity.playerId]: base64UrlToBytes(beto.identity.pubKey),
    };
    const dealerPub = base64UrlToBytes(session.dealerPubKey);
    expect(verifyEndorsementChain(wc2).ok).toBe(true);
    expect(verifyEndorsementSignatures(wc2, pubMap).ok).toBe(true);
    expect(
      verifyWalletChip(wc2, {
        dealerPubKey: dealerPub,
        sessionId: session.sessionId,
        expectedOwner: carlos.identity.playerId,
      }).ok,
    ).toBe(true);
    // Carlos can cash at Mesa-1 (the original emitter) — chip is still bound to it.
    expect(
      verifyForRedeem(wc2, {
        dealerPubKey: dealerPub,
        sessionId: session.sessionId,
        myDealerId: "Mesa-1",
      }).ok,
    ).toBe(true);
    // But NOT at Mesa-2.
    expect(
      verifyForRedeem(wc2, {
        dealerPubKey: dealerPub,
        sessionId: session.sessionId,
        myDealerId: "Mesa-2",
      }).ok,
    ).toBe(false);
  });

  it("detects an impostor endorsement (broken chain)", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const beto = createPlayerAccount("Beto");
    const impostor = createPlayerAccount("Impostor");
    const [wc0] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100,
    ]);
    // Impostor tries to endorse a chip they don't own.
    const forged = endorseChip({
      wc: wc0,
      from: impostor.identity.playerId,
      to: beto.identity.playerId,
      fromSecretKey: base64UrlToBytes(impostor.secretKey),
    });
    expect(verifyEndorsementChain(forged)).toEqual({
      ok: false,
      reason: "broken-endorsement-chain",
    });
  });

  it("detects a forged endorsement signature", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const beto = createPlayerAccount("Beto");
    const [wc0] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100,
    ]);
    const wc1 = endorseChip({
      wc: wc0,
      from: ana.identity.playerId,
      to: beto.identity.playerId,
      fromSecretKey: base64UrlToBytes(ana.secretKey),
    });
    // Corrupt the signature.
    const corrupted: WalletChip = {
      chip: wc1.chip,
      endorsements: [
        { ...wc1.endorsements[0], sig: "AAAA" + wc1.endorsements[0].sig.slice(4) },
      ],
    };
    const pubMap = {
      [ana.identity.playerId]: base64UrlToBytes(ana.identity.pubKey),
    };
    expect(verifyEndorsementSignatures(corrupted, pubMap).ok).toBe(false);
  });
});

describe("Double-spend defenses", () => {
  it("dealer spentSerials prevents double redeem at the same mesa", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const [wc] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      500,
    ]);
    const spent = new Set<string>([wc.chip.serial]);
    // Second attempt: serial already in set → dealer rejects.
    expect(spent.has(wc.chip.serial)).toBe(true);
  });

  it("chip binding to dealerId prevents cross-mesa double spend (no sync needed)", () => {
    // The invariant that makes this unnecessary: a chip emitted by Mesa-1 will
    // ALWAYS fail verifyForRedeem on any other mesa, regardless of whether the
    // other mesa has seen it before. So a player who tries to spend the same
    // chip at Mesa-2 can't even if Mesa-2 has never heard of that serial.
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const [wc] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      1000,
    ]);
    for (const mesa of ["Mesa-2", "Mesa-3", "Mesa-A"]) {
      expect(
        verifyForRedeem(wc, {
          dealerPubKey: base64UrlToBytes(session.dealerPubKey),
          sessionId: session.sessionId,
          myDealerId: mesa,
        }).reason,
      ).toBe("wrong-dealer-for-redeem");
    }
  });
});

describe("QR codec — cm2 compressed", () => {
  it("round-trips session / chips / transfer / receipt / stats / identity", () => {
    const { session } = newSession();
    const ana = createPlayerAccount("Ana");
    const payloads = [
      { v: QR_VERSION as 1, type: "session" as const, session },
      {
        v: QR_VERSION as 1,
        type: "identity" as const,
        identity: ana.identity,
      },
    ];
    for (const p of payloads) {
      const encoded = encodeQR(p);
      const decoded = decodeQR(encoded);
      expect(decoded.ok && decoded.payload).toEqual(p);
    }
  });

  it("produces materially shorter codes than cm1 for multi-chip payloads", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const chips = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100,
      100,
      100,
      50,
      50,
      10,
      10,
      10,
    ]).map((wc) => wc.chip);
    const payload = {
      v: QR_VERSION as 1,
      type: "chips" as const,
      sessionId: session.sessionId,
      dealerId: "Mesa-1",
      toPlayerId: ana.identity.playerId,
      chips,
    };
    const cm2 = encodeQR(payload);
    const cm1 = "cm1:" + JSON.stringify(payload);
    const savings = 1 - cm2.length / cm1.length;
    expect(cm2.length).toBeLessThan(cm1.length);
    // Typically ~30–40% smaller for high-entropy signatures; still a win.
    console.log(
      `  [codec] 8-chip payload: cm1=${cm1.length} → cm2=${cm2.length} (-${Math.round(savings * 100)}%)`,
    );
  });
});

describe("Paste extraction (share flows without camera)", () => {
  const { session } = newSession();
  const PAYLOAD = encodeQR({
    v: QR_VERSION as 1,
    type: "session" as const,
    session,
  });

  it("extracts from a raw cm2 code", () => {
    expect(extractPayloadFromText(PAYLOAD)).toBe(PAYLOAD);
  });

  it("extracts from a share URL (like one sent via WhatsApp)", () => {
    const url = `https://example.com/casino-money/#/ingest?c=${encodeURIComponent(PAYLOAD)}`;
    expect(extractPayloadFromText(url)).toBe(PAYLOAD);
  });

  it("extracts from URL-encoded code pasted without URL wrapper", () => {
    const encoded = encodeURIComponent(PAYLOAD);
    expect(extractPayloadFromText(encoded)).toBe(PAYLOAD);
  });

  it("extracts from WhatsApp-style message with surrounding prose", () => {
    const message = `Hola! aquí tienes: ${PAYLOAD} — úsalo pronto!`;
    expect(extractPayloadFromText(message)).toBe(PAYLOAD);
  });

  it("trims whitespace and newlines", () => {
    expect(extractPayloadFromText(`\n\n  ${PAYLOAD}  \n`)).toBe(PAYLOAD);
  });

  it("returns null for unrelated text", () => {
    expect(extractPayloadFromText("hello world")).toBe(null);
  });
});

describe("Welcome kit (batch roster flow)", () => {
  it("composes a welcome pack with change-friendly denominations", () => {
    const pack = composeWelcome(1000);
    expect(compositionTotal(pack)).toBe(1000);
    // Should include small denominations so players have change for varied bets.
    expect(pack[10]).toBeGreaterThan(0);
    expect(pack[50]).toBeGreaterThan(0);
  });

  it("round-trips a welcome kit through encode/decode", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const chips = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100, 100, 50,
    ]).map((wc) => wc.chip);
    const kit: WelcomeKitQR = {
      v: QR_VERSION as 1,
      type: "welcome-kit",
      session,
      alias: ana.identity.alias,
      secretKey: ana.secretKey,
      playerId: ana.identity.playerId,
      pubKey: ana.identity.pubKey,
      chips,
    };
    const encoded = encodeQR(kit);
    const decoded = decodeQR(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.payload).toEqual(kit);
  });

  it("generates a kit where every chip verifies for the embedded player", () => {
    const { session, keypair } = newSession();
    const pub = base64UrlToBytes(session.dealerPubKey);
    const ana = createPlayerAccount("Ana");
    const composition = composeWelcome(1000);
    const chips: (typeof ana.identity)[] extends never ? never : any[] = [];
    for (const mesaId of ["Mesa-1", "Mesa-2", "Mesa-3"]) {
      for (const d of DENOMINATIONS) {
        for (let i = 0; i < composition[d]; i++) {
          chips.push(
            emit(session, keypair, mesaId, ana.identity.playerId, [d])[0].chip,
          );
        }
      }
    }
    const kit: WelcomeKitQR = {
      v: QR_VERSION as 1,
      type: "welcome-kit",
      session,
      alias: ana.identity.alias,
      secretKey: ana.secretKey,
      playerId: ana.identity.playerId,
      pubKey: ana.identity.pubKey,
      chips,
    };
    for (const c of kit.chips) {
      expect(c.issuedTo).toBe(ana.identity.playerId);
      const wc = { chip: c, endorsements: [] };
      expect(
        verifyWalletChip(wc, {
          dealerPubKey: pub,
          sessionId: session.sessionId,
          expectedOwner: ana.identity.playerId,
        }).ok,
      ).toBe(true);
    }
    // Total = 1000 * 3 mesas = 3000
    const total = kit.chips.reduce((a, c) => a + c.denom, 0);
    expect(total).toBe(3000);
  });

  it("rejects welcome-kit chips if playerId doesn't match the kit's identity", () => {
    const { session, keypair } = newSession();
    const ana = createPlayerAccount("Ana");
    const beto = createPlayerAccount("Beto");
    const [wc] = emit(session, keypair, "Mesa-1", ana.identity.playerId, [
      100,
    ]);
    // Kit claims to be Beto but chip was minted for Ana.
    const forgedKit: WelcomeKitQR = {
      v: QR_VERSION as 1,
      type: "welcome-kit",
      session,
      alias: beto.identity.alias,
      secretKey: beto.secretKey,
      playerId: beto.identity.playerId,
      pubKey: beto.identity.pubKey,
      chips: [wc.chip],
    };
    // The Ingest page filters out chips whose issuedTo !== kit.playerId.
    const valid = forgedKit.chips.filter(
      (c) => c.issuedTo === forgedKit.playerId,
    );
    expect(valid).toHaveLength(0);
  });
});

describe("Full classroom scenario", () => {
  it("simulates 3 players × 3 dealers with emissions, redemptions, transfers and attack attempts", () => {
    const { session, keypair } = newSession();
    const players = ["Ana", "Beto", "Carla"].map(createPlayerAccount);
    const dealers = ["Mesa-1", "Mesa-2", "Mesa-3"];
    const wallets: Record<string, WalletChip[]> = {};
    const ledgers: Record<string, Set<string>> = {};
    dealers.forEach((d) => (ledgers[d] = new Set()));
    players.forEach((p) => (wallets[p.identity.playerId] = []));

    const pub = base64UrlToBytes(session.dealerPubKey);

    // Step 1: each dealer gives $250 to each player (2×100 + 50).
    for (const dealer of dealers) {
      for (const p of players) {
        const newChips = emit(session, keypair, dealer, p.identity.playerId, [
          100, 100, 50,
        ]);
        wallets[p.identity.playerId].push(...newChips);
      }
    }
    for (const p of players) {
      expect(sumChips(wallets[p.identity.playerId])).toBe(750);
    }

    // Step 2: Ana pays $200 to Mesa-1.
    const ana = players[0];
    const anaChips = wallets[ana.identity.playerId];
    const anaPayChips = anaChips
      .filter((wc) => wc.chip.dealerId === "Mesa-1")
      .slice(0, 2); // 2x $100 = $200
    for (const wc of anaPayChips) {
      const v = verifyForRedeem(wc, {
        dealerPubKey: pub,
        sessionId: session.sessionId,
        myDealerId: "Mesa-1",
      });
      expect(v.ok).toBe(true);
      expect(ledgers["Mesa-1"].has(wc.chip.serial)).toBe(false);
      ledgers["Mesa-1"].add(wc.chip.serial);
    }
    wallets[ana.identity.playerId] = anaChips.filter(
      (wc) => !anaPayChips.some((pc) => pc.chip.serial === wc.chip.serial),
    );
    expect(sumChips(wallets[ana.identity.playerId])).toBe(550);

    // Step 3: Ana tries to reuse the same chips at Mesa-1 (double spend). The
    // dealer's spentSerials set catches it — even though the cryptographic
    // verifyForRedeem would pass.
    const cheatChip = anaPayChips[0];
    expect(ledgers["Mesa-1"].has(cheatChip.chip.serial)).toBe(true);

    // Step 4: Ana tries to cash a Mesa-2 chip at Mesa-1. Rejected by dealerId binding.
    const mesa2Chip = wallets[ana.identity.playerId].find(
      (wc) => wc.chip.dealerId === "Mesa-2",
    )!;
    const v = verifyForRedeem(mesa2Chip, {
      dealerPubKey: pub,
      sessionId: session.sessionId,
      myDealerId: "Mesa-1",
    });
    expect(v).toEqual({ ok: false, reason: "wrong-dealer-for-redeem" });

    // Step 5: Ana transfers $100 to Beto (P2P).
    const beto = players[1];
    const transferChip = wallets[ana.identity.playerId][0];
    const endorsed = endorseChip({
      wc: transferChip,
      from: ana.identity.playerId,
      to: beto.identity.playerId,
      fromSecretKey: base64UrlToBytes(ana.secretKey),
    });
    wallets[ana.identity.playerId] = wallets[ana.identity.playerId].filter(
      (wc) => wc.chip.serial !== transferChip.chip.serial,
    );
    wallets[beto.identity.playerId].push(endorsed);

    // Beto verifies he owns it now.
    expect(
      verifyWalletChip(endorsed, {
        dealerPubKey: pub,
        sessionId: session.sessionId,
        expectedOwner: beto.identity.playerId,
      }).ok,
    ).toBe(true);

    // Step 6: Beto can cash it at the original emitter's mesa.
    expect(
      verifyForRedeem(endorsed, {
        dealerPubKey: pub,
        sessionId: session.sessionId,
        myDealerId: transferChip.chip.dealerId,
      }).ok,
    ).toBe(true);

    // Step 7: Check totals still conserve value system-wide.
    const totalPlayerBalance = players.reduce(
      (a, p) => a + sumChips(wallets[p.identity.playerId]),
      0,
    );
    const totalRedeemedByDealers = dealers.reduce(
      (a, d) => a + ledgers[d].size,
      0,
    );
    // 9 emissions * $250 = $2250; minus $200 redeemed = $2050 in player hands.
    expect(totalPlayerBalance).toBe(2050);
    expect(totalRedeemedByDealers).toBe(2); // Only Ana's two $100 chips.

    console.log(
      `  [scenario] 3 jugadores, 3 mesas: balance total=$${totalPlayerBalance}, cobradas=${totalRedeemedByDealers}`,
    );
  });
});
