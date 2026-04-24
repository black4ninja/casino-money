import { getBackendBaseURL } from "./parse";
import type { AuthRecord, AuthUser } from "@/storage/auth";

const BASE = `${getBackendBaseURL()}/api/v1`;

export type ApiError = { status: number; code?: string; message: string };

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    return {
      status: res.status,
      code: body?.code,
      message: body?.message ?? "Request failed",
    };
  } catch {
    return { status: res.status, message: "Request failed" };
  }
}

export async function apiLogin(
  matricula: string,
  password: string,
): Promise<AuthRecord> {
  const url = `${BASE}/auth/login`;
  console.info("[auth] POST", url, { matricula, passwordLength: password.length });
  let res: Response;
  try {
    // Only include password when non-empty — players don't send one.
    const body: { matricula: string; password?: string } = { matricula };
    if (password.length > 0) body.password = password;
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[auth] fetch failed (network/cors):", err);
    throw { status: 0, message: "No se pudo contactar al servidor" } as ApiError;
  }
  console.info("[auth] response status:", res.status);
  if (!res.ok) {
    const e = await parseError(res);
    console.warn("[auth] login rejected:", e);
    throw e;
  }
  return res.json();
}

/**
 * Pre-login probe — asks the backend whether this matrícula is a staff
 * account that needs a password. Unauthenticated. Used by LoginForm to
 * show/hide the password field based on the DB (never on matrícula shape).
 */
export async function apiLookupMatricula(
  matricula: string,
): Promise<{ requiresPassword: boolean }> {
  const clean = matricula.trim();
  if (!clean) return { requiresPassword: false };
  const url = `${BASE}/auth/lookup?matricula=${encodeURIComponent(clean)}`;
  const res = await fetch(url);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiRefresh(refreshToken: string): Promise<AuthRecord> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiLogout(
  refreshToken: string,
  accessToken: string,
): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function apiMe(accessToken: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type UserCollection = "masters" | "dealers" | "players";

export async function apiListUsers(
  accessToken: string,
  collection: UserCollection,
): Promise<{ users: AuthUser[] }> {
  const res = await fetch(`${BASE}/users/${collection}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Roster de quienes pueden ocupar el slot de tallador: dealers + masters.
 * Los admins operan mesas en la práctica, así que deben ser visibles en
 * los pickers de asignación.
 */
export async function apiListDealerCandidates(
  accessToken: string,
): Promise<{ users: AuthUser[] }> {
  const res = await fetch(`${BASE}/users/dealer-candidates`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiCreateUser(
  accessToken: string,
  collection: UserCollection,
  data: {
    matricula: string;
    /** Required for master/dealer; ignored for players (they don't use one). */
    password?: string;
    fullName?: string;
    /** Player-only. Ignored by the backend for staff. */
    departamento?: string;
  },
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/users/${collection}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiUpdateUser(
  accessToken: string,
  collection: UserCollection,
  id: string,
  data: {
    fullName?: string | null;
    departamento?: string | null;
    password?: string;
  },
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/users/${collection}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type BulkImportPlayerRow = {
  matricula: string;
  fullName?: string | null;
  departamento?: string | null;
};

export type BulkImportResult =
  | { row: number; matricula: string; status: "created"; userId: string }
  | {
      row: number;
      matricula: string;
      status: "error";
      code: string;
      message: string;
    };

export type BulkImportResponse = {
  results: BulkImportResult[];
  summary: { total: number; created: number; failed: number };
};

/**
 * CSV bulk import — players collection only. The backend attempts each row
 * independently and returns a per-row report; a partial failure does not
 * abort the whole batch.
 */
/**
 * Self-service alias update for the current player. Pass `null` or empty
 * string to clear the alias (UI then falls back to fullName / matricula).
 * Returns the updated user so callers can refresh their store.
 */
export async function apiUpdateMyAlias(
  accessToken: string,
  alias: string | null,
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/me/alias`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ alias }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Sorted, deduplicated list of `departamento` values currently in use by
 * active players. Used by the casino-detail multi-select.
 */
export async function apiListPlayerDepartamentos(
  accessToken: string,
): Promise<{ departamentos: string[] }> {
  const res = await fetch(`${BASE}/users/players/departamentos`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiBulkImportPlayers(
  accessToken: string,
  players: BulkImportPlayerRow[],
): Promise<BulkImportResponse> {
  const res = await fetch(`${BASE}/users/players/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ players }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiArchiveUser(
  accessToken: string,
  collection: UserCollection,
  id: string,
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/users/${collection}/${id}/archive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiUnarchiveUser(
  accessToken: string,
  collection: UserCollection,
  id: string,
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/users/${collection}/${id}/unarchive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiDeleteUser(
  accessToken: string,
  collection: UserCollection,
  id: string,
): Promise<void> {
  const res = await fetch(`${BASE}/users/${collection}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
}
