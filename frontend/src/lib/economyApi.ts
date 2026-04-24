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
    `${BASE}/me/casinos/${casinoId}/economy/bulk-credit`,
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
  effectiveAmount: number;
  appliedEvents: string[];
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
    `${BASE}/me/casinos/${casinoId}/economy/players/${playerId}/credit`,
    {
      method: "POST",
      headers: authedHeaders(accessToken, true),
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type DealerCommissionSummary = {
  dealerId: string;
  amount: number;
  outcome: CreditPlayerOutcome;
};

export type DebitPlayerResult = {
  batchId: string;
  amount: number;
  effectiveAmount: number;
  appliedEvents: string[];
  playerId: string;
  outcome: CreditPlayerOutcome;
  /**
   * Comisión que el backend acreditó al dealer operador. Null cuando el
   * actor es master (sin comisión) o cuando el cobro es tan pequeño que
   * la comisión redondeada queda en 0.
   */
  dealerCommission: DealerCommissionSummary | null;
};

/**
 * Cobro (débito) a un jugador específico del casino. Mismo contrato
 * idempotente que el depósito — reintentar con el mismo batchId es seguro.
 * El backend valida saldo suficiente antes de aplicar.
 */
export async function apiDebitPlayer(
  accessToken: string,
  casinoId: string,
  playerId: string,
  data: { amount: number; batchId: string; note?: string },
): Promise<DebitPlayerResult> {
  const res = await fetch(
    `${BASE}/me/casinos/${casinoId}/economy/players/${playerId}/debit`,
    {
      method: "POST",
      headers: authedHeaders(accessToken, true),
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type TransferToPlayerResult = {
  batchId: string;
  amount: number;
  fromPlayerId: string;
  toPlayerId: string;
  fromOutcome: CreditPlayerOutcome;
  toOutcome: CreditPlayerOutcome;
};

/**
 * Transferencia jugador→jugador dentro de un casino. El emisor es el
 * propio caller (sale del token). Idempotente por `batchId`. Si la pierna
 * receptora falla tras aplicar el débito, la UI muestra el detalle y pide
 * reconciliar al maestro (ledger queda con kind=player_transfer_in, status=failed).
 */
export async function apiTransferToPlayer(
  accessToken: string,
  casinoId: string,
  data: {
    toPlayerId: string;
    amount: number;
    batchId: string;
    note?: string;
  },
): Promise<TransferToPlayerResult> {
  const res = await fetch(
    `${BASE}/me/casinos/${casinoId}/transfer-to-player`,
    {
      method: "POST",
      headers: authedHeaders(accessToken, true),
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Roster del casino visible para el propio jugador autenticado (se excluye
 * a sí mismo). Sirve como fuente del selector "transferir a otro jugador".
 * No expone balances — sólo nombre/matrícula/departamento.
 */
export async function apiListMyCasinoPlayers(
  accessToken: string,
  casinoId: string,
): Promise<{ players: AuthUser[] }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/players`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type EconomyWalletRow = {
  /** Titular del wallet. Puede ser player del roster o dealer asignado al casino. */
  user: AuthUser;
  walletId: string | null;
  balance: number;
  walletActive: boolean;
};

/**
 * Una fila por titular con wallet potencial en el casino: cada jugador del
 * roster más cada dealer asignado. Si aún no tiene monedero (nadie le ha
 * acreditado, ningún cobro le ha comisionado) balance=0 y walletId=null.
 */
export async function apiListCasinoEconomyWallets(
  accessToken: string,
  casinoId: string,
): Promise<{ rows: EconomyWalletRow[] }> {
  const res = await fetch(
    `${BASE}/me/casinos/${casinoId}/economy/wallets`,
    { headers: authedHeaders(accessToken) },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type WalletTransaction = {
  id: string;
  walletId: string;
  casinoId: string;
  userId: string;
  kind:
    | "global_credit"
    | "player_deposit"
    | "player_debit"
    | "player_transfer_out"
    | "player_transfer_in"
    | "slot_bet"
    | "slot_payout"
    | "carrera_bet"
    | "carrera_payout"
    | "auction_purchase"
    | "dealer_commission"
    | "greedy_reward";
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
    `${BASE}/me/casinos/${casinoId}/economy/players/${playerId}/transactions`,
    { headers: authedHeaders(accessToken) },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}
