import { create } from "zustand";
import type { Keypair } from "@/crypto/signatures";
import {
  loadLastMesa,
  loadLedger,
  recordIssued,
  recordRedeemed,
  saveLastMesa,
  type DealerLedger,
} from "@/storage/dealer";
import type { IssuedRecord, RedeemedRecord } from "@/domain/types";

type State = {
  /** In-memory only — never persisted. Cleared on reload for security. */
  keypair: Keypair | null;
  dealerId: string | null;
  ledger: DealerLedger | null;
  login: (args: { keypair: Keypair; dealerId: string; sessionId: string }) => void;
  logout: () => void;
  addIssued: (records: IssuedRecord[]) => void;
  addRedeemed: (records: RedeemedRecord[]) => void;
};

export const useDealerStore = create<State>((set, get) => ({
  keypair: null,
  dealerId: loadLastMesa(),
  ledger: null,
  login: ({ keypair, dealerId, sessionId }) => {
    saveLastMesa(dealerId);
    const ledger = loadLedger(sessionId, dealerId);
    set({ keypair, dealerId, ledger });
  },
  logout: () => {
    set({ keypair: null, ledger: null });
  },
  addIssued: (records) => {
    const ledger = get().ledger;
    if (!ledger) return;
    const updated = recordIssued(ledger, records);
    set({ ledger: updated });
  },
  addRedeemed: (records) => {
    const ledger = get().ledger;
    if (!ledger) return;
    const updated = recordRedeemed(ledger, records);
    set({ ledger: updated });
  },
}));
