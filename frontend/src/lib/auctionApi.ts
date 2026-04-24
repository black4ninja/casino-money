import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";

const BASE = `${getBackendBaseURL()}/api/v1`;

export type Auction = {
  id: string;
  casinoId: string;
  /** Valor actual de la puja en MXN. 0 cuando la ronda fue reseteada. */
  currentBid: number;
  /** Jugador con la paleta levantada más reciente; null si nadie. */
  currentBidderId: string | null;
  /** Alias denormalizado para pintar el display sin resolver usuarios. */
  currentBidderAlias: string | null;
  /** Oferta firme previa — alguien que pujó antes del último ajuste de precio. */
  lastConfirmedBid: number | null;
  lastConfirmedBidderId: string | null;
  lastConfirmedBidderAlias: string | null;
  /** Última venta ("Vendido!") registrada — se muestra en el display. */
  lastSoldBid: number | null;
  lastSoldBidderId: string | null;
  lastSoldBidderAlias: string | null;
  /** Contador de rondas — incrementa en cada reset o vendido. */
  roundNumber: number;
  updatedAt: string;
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

/** GET público — sirve al display global del proyector (sin auth). */
export async function apiGetPublicAuction(
  casinoId: string,
): Promise<{ auction: Auction }> {
  const res = await fetch(
    `${BASE}/public/casinos/${casinoId}/auction`,
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/** GET autenticado — admin o jugador. */
export async function apiGetAuction(
  accessToken: string,
  casinoId: string,
): Promise<{ auction: Auction }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/auction`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Jugador oferta un monto (múltiplo de $100, ≥ currentBid, > si ya hay otro
 * pujador). El monto aceptado se convierte en el nuevo currentBid y el
 * jugador queda como pujador visible.
 */
export async function apiRaisePaddle(
  accessToken: string,
  casinoId: string,
  amount: number,
): Promise<{ auction: Auction }> {
  const res = await fetch(
    `${BASE}/me/casinos/${casinoId}/auction/raise-paddle`,
    {
      method: "POST",
      headers: authedHeaders(accessToken, true),
      body: JSON.stringify({ amount }),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/** Anunciador setea el piso de la puja. Limpia al pujador actual. */
export async function apiSetAuctionInitial(
  accessToken: string,
  casinoId: string,
  initialValue: number,
): Promise<{ auction: Auction }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/auction/initial`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify({ initialValue }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Anunciador ajusta el valor actual:
 *   op="add", factor=1000|10000|100000 → suma al current.
 *   op="mul", factor=2|3|4 → multiplica el current.
 * Limpia al pujador actual (el precio cambió).
 */
export async function apiAdjustAuction(
  accessToken: string,
  casinoId: string,
  op: "add" | "mul",
  factor: number,
): Promise<{ auction: Auction }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/auction/adjust`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify({ op, factor }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/**
 * Anunciador marca como "Vendido!" — adjudica al pujador actual (o a la
 * última oferta firme si el precio se ajustó y nadie lo igualó). Registra
 * el ganador en `lastSold*` y avanza al siguiente artículo (round++).
 */
export async function apiMarkAuctionSold(
  accessToken: string,
  casinoId: string,
): Promise<{ auction: Auction }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/auction/sold`, {
    method: "POST",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/** Anunciador reinicia la ronda (valor=0, sin pujador, round++). */
export async function apiResetAuction(
  accessToken: string,
  casinoId: string,
): Promise<{ auction: Auction }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/auction/reset`, {
    method: "POST",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
