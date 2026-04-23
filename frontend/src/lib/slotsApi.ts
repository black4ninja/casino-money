import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";
import type { SlotSymbolId } from "@/domain/slotSymbols";

const BASE = `${getBackendBaseURL()}/api/v1`;

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

export type SlotSpinOutcome =
  | "jackpot_triple_wild"
  | "triple_pattern"
  | "line_of_patterns"
  | "two_wilds_one_pattern"
  | "wild_completes_pair"
  | "pair"
  | "anti_pattern_loss"
  | "no_match";

export type SlotSpinPayload = {
  id: string;
  casinoId: string;
  playerId: string;
  walletId: string;
  bet: number;
  result: [SlotSymbolId, SlotSymbolId, SlotSymbolId];
  multiplier: number;
  payout: number;
  net: number;
  batchId: string;
  createdAt: string;
};

export type SlotSpinResponse = {
  spin: SlotSpinPayload;
  balanceAfter: number;
  outcome: SlotSpinOutcome;
  replayed: boolean;
};

/**
 * Juega una tirada. El `batchId` debe ser único por intención de tirada —
 * generar con `crypto.randomUUID()`. Reintentar con el mismo batchId es
 * seguro: el backend devuelve el spin previo sin cobrar ni rodar de nuevo.
 */
export async function apiPlaySlotSpin(
  accessToken: string,
  casinoId: string,
  data: { bet: number; batchId: string },
): Promise<SlotSpinResponse> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/slots/spin`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiListSlotHistory(
  accessToken: string,
  casinoId: string,
  limit = 50,
): Promise<{ spins: SlotSpinPayload[] }> {
  const url = `${BASE}/me/casinos/${casinoId}/slots/history?limit=${encodeURIComponent(String(limit))}`;
  const res = await fetch(url, { headers: authedHeaders(accessToken) });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type SlotWalletInfo = {
  balance: number;
  active: boolean;
  /** `true` cuando el jugador aún no ha tenido ningún movimiento en este casino. */
  lazy: boolean;
};

/** Consulta el saldo del jugador autenticado en un casino específico. */
export async function apiGetMyCasinoSlotWallet(
  accessToken: string,
  casinoId: string,
): Promise<SlotWalletInfo> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/slots/wallet`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
