import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";
import type { AuthUser } from "@/storage/auth";

const BASE = `${getBackendBaseURL()}/api/v1`;

/**
 * A casino event scheduled by a master. Shares the lifecycle contract of
 * every admin-managed entity (see memory/project_entity_lifecycle_pattern):
 *   active=false → archived (cannot be operated on; reversible),
 *   exists=false → soft-deleted (hidden from listings; implies active=false).
 */
export type Casino = {
  id: string;
  name: string;
  /** ISO-8601 — stored/transported as UTC, rendered with the user's locale. */
  date: string;
  /**
   * Player department names assigned to this casino. Membership is dynamic:
   * any active player whose `departamento` is in this list plays here.
   */
  departamentos: string[];
  /**
   * Dealers explicitly assigned to this casino. When non-empty, Mesa can
   * only accept a tallador from this list.
   */
  dealerIds: string[];
  active: boolean;
  /**
   * Modo subasta. Cuando es true, todas las operaciones monetarias están
   * suspendidas y se habilita el flujo de puja (paletas, no dinero).
   */
  subastaActive: boolean;
  exists: boolean;
  createdAt: string;
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

export async function apiListCasinos(
  accessToken: string,
): Promise<{ casinos: Casino[] }> {
  const res = await fetch(`${BASE}/casinos`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiGetCasino(
  accessToken: string,
  id: string,
): Promise<{ casino: Casino }> {
  const res = await fetch(`${BASE}/casinos/${id}`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiCreateCasino(
  accessToken: string,
  data: { name: string; date: string },
): Promise<{ casino: Casino }> {
  const res = await fetch(`${BASE}/casinos`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiUpdateCasino(
  accessToken: string,
  id: string,
  data: {
    name?: string;
    date?: string;
    departamentos?: string[];
    dealerIds?: string[];
  },
): Promise<{ casino: Casino }> {
  const res = await fetch(`${BASE}/casinos/${id}`, {
    method: "PATCH",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Casinos the caller (typically a player) is eligible to play in. A casino
 * is included only if it is active, not soft-deleted, and its
 * `departamentos` array contains the caller's `departamento`. Staff roles
 * always get an empty list from this endpoint.
 */
export async function apiListMyCasinos(
  accessToken: string,
): Promise<{ casinos: Casino[] }> {
  const res = await fetch(`${BASE}/me/casinos`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Materialized roster of the casino — all active players whose `departamento`
 * is in `casino.departamentos`. Empty array means the casino has no players
 * assigned yet.
 */
export async function apiListCasinoPlayers(
  accessToken: string,
  id: string,
): Promise<{ players: AuthUser[] }> {
  const res = await fetch(`${BASE}/casinos/${id}/players`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiArchiveCasino(
  accessToken: string,
  id: string,
): Promise<{ casino: Casino }> {
  const res = await fetch(`${BASE}/casinos/${id}/archive`, {
    method: "POST",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiUnarchiveCasino(
  accessToken: string,
  id: string,
): Promise<{ casino: Casino }> {
  const res = await fetch(`${BASE}/casinos/${id}/unarchive`, {
    method: "POST",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Enciende o apaga el modo subasta del casino. Mientras está encendido,
 * el backend bloquea toda operación de dinero (crédito, cobro, transferencia,
 * tragamonedas, carrera) y habilita el flujo de paletas.
 */
export async function apiSetCasinoSubasta(
  accessToken: string,
  id: string,
  subastaActive: boolean,
): Promise<{ casino: Casino }> {
  const res = await fetch(`${BASE}/casinos/${id}/subasta`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify({ subastaActive }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiDeleteCasino(
  accessToken: string,
  id: string,
): Promise<void> {
  const res = await fetch(`${BASE}/casinos/${id}`, {
    method: "DELETE",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
}

export type ClaimGreedyRewardResponse = {
  batchId: string;
  balance: number;
  outcome:
    | { status: "credited"; balance: number }
    | { status: "skipped"; balance: number | null }
    | { status: "recovered"; balance: number }
    | { status: "failed"; balance: null; reason: string };
};

/**
 * Mini-clicker Greedy: el cliente acumula 10 toques locales sobre la imagen
 * del banner y acá cobra +1 al wallet del jugador en este casino. Idempotente
 * por `batchId` — si el POST falla y el cliente reintenta con el mismo id, el
 * backend devuelve `skipped` sin duplicar el crédito.
 */
export async function apiClaimGreedyReward(
  accessToken: string,
  casinoId: string,
  batchId: string,
): Promise<ClaimGreedyRewardResponse> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/greedy-reward`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify({ batchId }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
