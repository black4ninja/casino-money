import { create } from "zustand";
import type { HistoryEntry, WalletChip } from "@/domain/types";
import type { PlayerAccount } from "@/domain/player";
import {
  addToWallet,
  appendHistory,
  clearAccount,
  loadAccount,
  loadHistory,
  loadWalletChips,
  removeFromWallet,
  saveAccount,
  saveWalletChips,
} from "@/storage/wallet";

type State = {
  account: PlayerAccount | null;
  chipsBySession: Record<string, WalletChip[]>;
  historyBySession: Record<string, HistoryEntry[]>;

  setAccount: (a: PlayerAccount) => void;
  clearAccount: () => void;
  hydrateForSession: (sessionId: string) => void;
  addChips: (sessionId: string, chips: WalletChip[]) => void;
  replaceChips: (sessionId: string, chips: WalletChip[]) => void;
  removeChips: (sessionId: string, serials: string[]) => void;
  appendHistory: (sessionId: string, entries: HistoryEntry[]) => void;
};

export const usePlayerStore = create<State>((set, get) => ({
  account: loadAccount(),
  chipsBySession: {},
  historyBySession: {},

  setAccount: (a) => {
    saveAccount(a);
    set({ account: a });
  },
  clearAccount: () => {
    clearAccount();
    set({ account: null });
  },
  hydrateForSession: (sessionId) => {
    const chips = loadWalletChips(sessionId);
    const history = loadHistory(sessionId);
    set({
      chipsBySession: { ...get().chipsBySession, [sessionId]: chips },
      historyBySession: { ...get().historyBySession, [sessionId]: history },
    });
  },
  addChips: (sessionId, chips) => {
    const merged = addToWallet(sessionId, chips);
    set({ chipsBySession: { ...get().chipsBySession, [sessionId]: merged } });
  },
  replaceChips: (sessionId, chips) => {
    saveWalletChips(sessionId, chips);
    set({ chipsBySession: { ...get().chipsBySession, [sessionId]: chips } });
  },
  removeChips: (sessionId, serials) => {
    const remaining = removeFromWallet(sessionId, serials);
    set({
      chipsBySession: { ...get().chipsBySession, [sessionId]: remaining },
    });
  },
  appendHistory: (sessionId, entries) => {
    const merged = appendHistory(sessionId, entries);
    set({
      historyBySession: { ...get().historyBySession, [sessionId]: merged },
    });
  },
}));
