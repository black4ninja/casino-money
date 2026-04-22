import { STORAGE_KEYS } from "./keys";
import { loadJSON, removeKey, saveJSON } from "./versioned";

export type Role = "player" | "dealer" | "master";

export type AuthUser = {
  id: string;
  matricula: string;
  role: Role;
  fullName: string | null;
  active: boolean;
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
