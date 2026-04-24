import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";

const BASE = `${getBackendBaseURL()}/api/v1`;

/**
 * A mesa (table) inside a casino event. For now carries only its game type
 * — talladores and juego-runtime wiring will land later. Same lifecycle
 * contract as every admin-managed entity (active + exists flags).
 */
export type Mesa = {
  id: string;
  casinoId: string;
  gameType: string;
  /** AppUser.id of the assigned tallador, or null if none. */
  talladorId: string | null;
  active: boolean;
  exists: boolean;
  createdAt: string;
};

/**
 * Enriched mesa payload for the "me" endpoint — each mesa comes paired with
 * the casino it belongs to so a dealer UI can render in one request.
 */
export type MyMesa = Mesa & {
  casino: {
    id: string;
    name: string;
    date: string;
    active: boolean;
    subastaActive: boolean;
    exists: boolean;
    createdAt: string;
  };
};

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

function authedHeaders(accessToken: string, withBody = false): HeadersInit {
  const h: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
  if (withBody) h["Content-Type"] = "application/json";
  return h;
}

export async function apiListMesas(
  accessToken: string,
  casinoId: string,
): Promise<{ mesas: Mesa[] }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/mesas`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiCreateMesa(
  accessToken: string,
  casinoId: string,
  data: { gameType: string },
): Promise<{ mesa: Mesa }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/mesas`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiUpdateMesa(
  accessToken: string,
  casinoId: string,
  mesaId: string,
  data: { gameType?: string; talladorId?: string | null },
): Promise<{ mesa: Mesa }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/mesas/${mesaId}`, {
    method: "PATCH",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiArchiveMesa(
  accessToken: string,
  casinoId: string,
  mesaId: string,
): Promise<{ mesa: Mesa }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/mesas/${mesaId}/archive`, {
    method: "POST",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiUnarchiveMesa(
  accessToken: string,
  casinoId: string,
  mesaId: string,
): Promise<{ mesa: Mesa }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/mesas/${mesaId}/unarchive`, {
    method: "POST",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiDeleteMesa(
  accessToken: string,
  casinoId: string,
  mesaId: string,
): Promise<void> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/mesas/${mesaId}`, {
    method: "DELETE",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
}

/**
 * Active mesas of a casino the current player is allowed to play in. The
 * backend enforces the same departamento rule as `/me/casinos` — players
 * who don't belong get an empty list. Archived / deleted mesas never show.
 */
export async function apiListMyCasinoMesas(
  accessToken: string,
  casinoId: string,
): Promise<{ mesas: Mesa[] }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/mesas`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Mesas assigned to the current authenticated user (as tallador). Used by
 * the dealer home page to show what table they're running. Masters will
 * normally get an empty list since admins don't deal tables.
 */
export async function apiListMyMesas(
  accessToken: string,
): Promise<{ mesas: MyMesa[] }> {
  const res = await fetch(`${BASE}/me/mesas`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
