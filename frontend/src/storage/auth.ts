import { STORAGE_KEYS } from "./keys";
import { loadJSON, removeKey, saveJSON } from "./versioned";

export type Role = "player" | "dealer" | "master";

export type AuthUser = {
  id: string;
  matricula: string;
  role: Role;
  fullName: string | null;
  /**
   * Player-only field — department / program. Always null for staff accounts
   * (master/dealer). Populated from single-create or CSV bulk import.
   */
  departamento: string | null;
  /**
   * Lifecycle flags (shared across every admin-managed entity in the app):
   *   active = false  → archived; cannot log in or perform actions.
   *   exists = false  → soft-deleted; hidden from every listing.
   * Invariant: exists=false implies active=false.
   */
  active: boolean;
  exists: boolean;
  createdAt: string;
};

export type AuthRecord = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export function loadAuth(): AuthRecord | null {
  return loadJSON<AuthRecord | null>(STORAGE_KEYS.auth, null);
}

export function saveAuth(record: AuthRecord): void {
  saveJSON(STORAGE_KEYS.auth, record);
}

export function clearAuth(): void {
  removeKey(STORAGE_KEYS.auth);
}
