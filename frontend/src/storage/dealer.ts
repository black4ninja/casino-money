import type {
  DealerId,
  IssuedRecord,
  RedeemedRecord,
  SessionId,
} from "@/domain/types";
import { STORAGE_KEYS } from "./keys";
import { loadJSON, saveJSON } from "./versioned";

export type DealerLedger = {
  sessionId: SessionId;
  dealerId: DealerId;
  issued: IssuedRecord[];
  redeemed: RedeemedRecord[];
  /** Serials marked as spent at this mesa — THIS is the double-spend guard. */
  spentSerials: string[];
};

function emptyLedger(
  sessionId: SessionId,
  dealerId: DealerId,
): DealerLedger {
  return {
    sessionId,
    dealerId,
    issued: [],
    redeemed: [],
    spentSerials: [],
  };
}

export function loadLedger(
  sessionId: SessionId,
  dealerId: DealerId,
): DealerLedger {
  return loadJSON<DealerLedger>(
    STORAGE_KEYS.dealerLedger(sessionId, dealerId),
    emptyLedger(sessionId, dealerId),
  );
}

export function saveLedger(ledger: DealerLedger): void {
  saveJSON(STORAGE_KEYS.dealerLedger(ledger.sessionId, ledger.dealerId), ledger);
}

export function isSpent(ledger: DealerLedger, serial: string): boolean {
  return ledger.spentSerials.includes(serial);
}

export function recordIssued(
  ledger: DealerLedger,
  records: IssuedRecord[],
): DealerLedger {
  const updated: DealerLedger = {
    ...ledger,
    issued: [...ledger.issued, ...records],
  };
  saveLedger(updated);
  return updated;
}

export function recordRedeemed(
  ledger: DealerLedger,
  records: RedeemedRecord[],
): DealerLedger {
  const newSerials = records.map((r) => r.serial);
  const merged = new Set([...ledger.spentSerials, ...newSerials]);
  const updated: DealerLedger = {
    ...ledger,
    redeemed: [...ledger.redeemed, ...records],
    spentSerials: Array.from(merged),
  };
  saveLedger(updated);
  return updated;
}

export function loadLastMesa(): string | null {
  return loadJSON<string | null>(STORAGE_KEYS.dealerLastMesa, null);
}

export function saveLastMesa(mesa: string): void {
  saveJSON(STORAGE_KEYS.dealerLastMesa, mesa);
}

export function totals(ledger: DealerLedger): {
  issuedCount: number;
  issuedAmount: number;
  redeemedCount: number;
  redeemedAmount: number;
  net: number;
} {
  const issuedAmount = ledger.issued.reduce((a, r) => a + r.denom, 0);
  const redeemedAmount = ledger.redeemed.reduce((a, r) => a + r.denom, 0);
  return {
    issuedCount: ledger.issued.length,
    issuedAmount,
    redeemedCount: ledger.redeemed.length,
    redeemedAmount,
    net: issuedAmount - redeemedAmount,
  };
}
