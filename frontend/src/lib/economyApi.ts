import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";
import type { AuthUser } from "@/storage/auth";

const BASE = `${getBackendBaseURL()}/api/v1`;

export type BulkCreditFailure = {
  playerId: string;
  reason: string;
};

export type BulkCreditResult = {
  batchId: string;
  amount: number;
  creditedCount: number;
  skippedCount: number;
  failedCount: number;
  totalIssued: number;
  playersCredited: string[];
  playersSkipped: string[];
  playersFailed: BulkCreditFailure[];
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

/**
 * Acredita `amount` MXN a todos los jugadores del roster del casino.
 *
 * Idempotente por `batchId`: reintentar con el mismo batchId y amount no
 * causa doble crédito — el backend detecta via `idempotencyKey` y responde
 * con `skippedCount`. Genera un nuevo batchId (`crypto.randomUUID()`) cuando
 * quieras una nueva ronda de créditos distinta.
 */
export async function apiBulkCreditCasinoPlayers(
  accessToken: string,
  casinoId: string,
  data: { amount: number; batchId: string; note?: string },
): Promise<BulkCreditResult> {
  const res = await fetch(
    `${BASE}/casinos/${casinoId}/economy/bulk-credit`,
    {
      method: "POST",
      headers: authedHeaders(accessToken, true),
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type CreditPlayerOutcome =
  | { status: "credited"; balance: number }
  | { status: "skipped"; balance: number | null }
  | { status: "recovered"; balance: number }
  | { status: "failed"; balance: null; reason: string };

export type CreditPlayerResult = {
  batchId: string;
  amount: number;
  playerId: string;
  outcome: CreditPlayerOutcome;
};

/**
 * Depósito individual a un jugador específico del casino. Misma semántica
 * idempotente que el bulk-credit — reintentar con mismo batchId es seguro.
 */
export async function apiCreditPlayer(
  accessToken: string,
  casinoId: string,
  playerId: string,
  data: { amount: number; batchId: string; note?: string },
): Promise<CreditPlayerResult> {
  const res = await fetch(
    `${BASE}/casinos/${casinoId}/economy/players/${playerId}/credit`,
    {
      method: "POST",
      headers: authedHeaders(accessToken, true),
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type EconomyWalletRow = {
  player: AuthUser;
  walletId: string | null;
  balance: number;
  walletActive: boolean;
};

/**
 * Una fila por jugador del roster del casino con su balance actual. Si el
 * jugador aún no tiene monedero (nadie le ha acreditado), balance=0 y
 * walletId=null.
 */
export async function apiListCasinoEconomyWallets(
  accessToken: string,
  casinoId: string,
): Promise<{ rows: EconomyWalletRow[] }> {
  const res = await fetch(
    `${BASE}/casinos/${casinoId}/economy/wallets`,
    { headers: authedHeaders(accessToken) },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type WalletTransaction = {
  id: string;
  walletId: string;
  casinoId: string;
  playerId: string;
  kind: "global_credit" | "player_deposit";
  delta: number;
  balanceAfter: number | null;
  idempotencyKey: string;
  batchId: string;
  actorId: string;
  note: string | null;
  status: "pending" | "committed" | "committed_recovered" | "failed";
  createdAt: string;
};

/**
 * Historial completo de movimientos de un jugador en un casino específico.
 * Ordenado del más reciente al más viejo. Limitado a 200 entradas.
 */
export async function apiListPlayerCasinoTransactions(
  accessToken: string,
  casinoId: string,
  playerId: string,
): Promise<{ transactions: WalletTransaction[] }> {
  const res = await fetch(
    `${BASE}/casinos/${casinoId}/economy/players/${playerId}/transactions`,
    { headers: authedHeaders(accessToken) },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}
