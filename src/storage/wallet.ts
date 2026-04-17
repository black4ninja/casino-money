import type { HistoryEntry, WalletChip } from "@/domain/types";
import type { PlayerAccount } from "@/domain/player";
import { STORAGE_KEYS } from "./keys";
import { loadJSON, removeKey, saveJSON } from "./versioned";

export function loadAccount(): PlayerAccount | null {
  return loadJSON<PlayerAccount | null>(STORAGE_KEYS.playerAccount, null);
}

export function saveAccount(account: PlayerAccount): void {
  saveJSON(STORAGE_KEYS.playerAccount, account);
}

export function clearAccount(): void {
  removeKey(STORAGE_KEYS.playerAccount);
}

export function loadWalletChips(sessionId: string): WalletChip[] {
  return loadJSON<WalletChip[]>(STORAGE_KEYS.walletChips(sessionId), []);
}

export function saveWalletChips(
  sessionId: string,
  chips: WalletChip[],
): void {
  saveJSON(STORAGE_KEYS.walletChips(sessionId), chips);
}

export function addToWallet(
  sessionId: string,
  newChips: WalletChip[],
): WalletChip[] {
  const existing = loadWalletChips(sessionId);
  const existingSerials = new Set(existing.map((c) => c.chip.serial));
  const deduped = newChips.filter((c) => !existingSerials.has(c.chip.serial));
  const merged = [...existing, ...deduped];
  saveWalletChips(sessionId, merged);
  return merged;
}

export function removeFromWallet(
  sessionId: string,
  serials: string[],
): WalletChip[] {
  const remove = new Set(serials);
  const remaining = loadWalletChips(sessionId).filter(
    (c) => !remove.has(c.chip.serial),
  );
  saveWalletChips(sessionId, remaining);
  return remaining;
}

export function loadHistory(sessionId: string): HistoryEntry[] {
  return loadJSON<HistoryEntry[]>(STORAGE_KEYS.playerHistory(sessionId), []);
}

export function appendHistory(
  sessionId: string,
  entries: HistoryEntry[],
): HistoryEntry[] {
  const existing = loadHistory(sessionId);
  const merged = [...existing, ...entries];
  saveJSON(STORAGE_KEYS.playerHistory(sessionId), merged);
  return merged;
}
