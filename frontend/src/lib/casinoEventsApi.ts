import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";

const BASE = `${getBackendBaseURL()}/api/v1`;

export type CasinoEventType =
  | "WIN_DOUBLE"
  | "LOSS_DOUBLE"
  | "SLOT_DOUBLE"
  | "CARRERA_DOUBLE"
  | "GREEDY_DOUBLE";

export type CasinoEvent = {
  id: string;
  casinoId: string;
  name: string;
  type: CasinoEventType;
  active: boolean;
  exists: boolean;
  createdAt: string;
  updatedAt: string;
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

/** Admin — todos los eventos del casino (incluye archivados, excluye eliminados). */
export async function apiListCasinoEvents(
  accessToken: string,
  casinoId: string,
): Promise<{ events: CasinoEvent[] }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/events`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

/** Cualquier usuario autenticado — sólo eventos en curso. Usado por el
 *  banner del jugador para enterarse sin recargar. */
export async function apiListActiveCasinoEvents(
  accessToken: string,
  casinoId: string,
): Promise<{ events: CasinoEvent[] }> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/events`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiCreateCasinoEvent(
  accessToken: string,
  casinoId: string,
  data: { name: string; type: CasinoEventType },
): Promise<{ event: CasinoEvent }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/events`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiUpdateCasinoEvent(
  accessToken: string,
  casinoId: string,
  eventId: string,
  data: { name?: string },
): Promise<{ event: CasinoEvent }> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/events/${eventId}`, {
    method: "PATCH",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiActivateCasinoEvent(
  accessToken: string,
  casinoId: string,
  eventId: string,
): Promise<{ event: CasinoEvent }> {
  const res = await fetch(
    `${BASE}/casinos/${casinoId}/events/${eventId}/activate`,
    {
      method: "POST",
      headers: authedHeaders(accessToken),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiDeactivateCasinoEvent(
  accessToken: string,
  casinoId: string,
  eventId: string,
): Promise<{ event: CasinoEvent }> {
  const res = await fetch(
    `${BASE}/casinos/${casinoId}/events/${eventId}/deactivate`,
    {
      method: "POST",
      headers: authedHeaders(accessToken),
    },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiDeleteCasinoEvent(
  accessToken: string,
  casinoId: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(`${BASE}/casinos/${casinoId}/events/${eventId}`, {
    method: "DELETE",
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
}

/** Metadata de presentación — usado en admin (form de create/edit) y
 *  en el banner del jugador para explicar el efecto. */
export const CASINO_EVENT_META: Record<
  CasinoEventType,
  {
    label: string;
    shortLabel: string;
    description: string;
    emoji: string;
    /** Tono del badge/card para el jugador cuando está activo. */
    tone: "gold" | "danger";
  }
> = {
  WIN_DOUBLE: {
    label: "Doble ganancia",
    shortLabel: "Ganancia x2",
    description:
      "Mientras esté activo, todos los depósitos del dealer o maestro al jugador se duplican.",
    emoji: "💰",
    tone: "gold",
  },
  LOSS_DOUBLE: {
    label: "Cobros dobles",
    shortLabel: "Cobro x2",
    description:
      "Mientras esté activo, todos los cobros del dealer o maestro al jugador se duplican.",
    emoji: "🔥",
    tone: "danger",
  },
  SLOT_DOUBLE: {
    label: "Tragamonedas al doble",
    shortLabel: "Slots x2",
    description:
      "Mientras esté activo, los premios de la tragamonedas pagan el doble.",
    emoji: "🎰",
    tone: "gold",
  },
  CARRERA_DOUBLE: {
    label: "Carrera al doble",
    shortLabel: "Carrera x2",
    description:
      "Mientras esté activo, los pagos ganadores de la Carrera de Patrones se duplican.",
    emoji: "🏁",
    tone: "gold",
  },
  GREEDY_DOUBLE: {
    label: "Greedy generoso",
    shortLabel: "Greedy x2",
    description:
      "Mientras esté activo, cada ficha rota de Greedy vale el doble.",
    emoji: "✨",
    tone: "gold",
  },
};
