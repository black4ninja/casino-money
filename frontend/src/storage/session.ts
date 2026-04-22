import type { Session } from "@/domain/types";
import { STORAGE_KEYS } from "./keys";
import { loadJSON, removeKey, saveJSON } from "./versioned";

export function loadSession(): Session | null {
  return loadJSON<Session | null>(STORAGE_KEYS.session, null);
}

export function saveSession(session: Session): void {
  saveJSON(STORAGE_KEYS.session, session);
}

export function clearSession(): void {
  removeKey(STORAGE_KEYS.session);
}
