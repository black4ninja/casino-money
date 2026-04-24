import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";

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

export type PatternRacePhase = "betting" | "racing";
export type PatternRaceContestantPayload = {
  patternId: string;
  label: string;
  emoji: string;
  kind: "creational" | "behavioral" | "structural" | "anti";
  bonus: number;
  finishAtMs: number;
  finalPosition: number;
};
export type PatternRaceBlueprintPayload = {
  cycleIndex: number;
  problem: { id: string; statement: string; hint: string };
  contestants: PatternRaceContestantPayload[];
  raceStartedAt: string;
  raceEndsAt: string;
  raceElapsedMs: number;
  raceDurationMs: number;
  bettingClosesAt: string;
};
export type PatternRaceSnapshot = {
  casino: { id: string; name: string };
  now: string;
  phase: PatternRacePhase;
  phaseRemainingMs: number;
  current: PatternRaceBlueprintPayload;
  previous: PatternRaceBlueprintPayload | null;
};

/** Público — no requiere auth. Usado por la pantalla de proyección. */
export async function apiGetPatternRaceCurrent(
  casinoId: string,
): Promise<PatternRaceSnapshot> {
  const res = await fetch(
    `${BASE}/public/casinos/${casinoId}/carrera/current`,
    { cache: "no-store" },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type PatternRaceBetKind = "win" | "podium";
export type PatternRaceBetStatus = "open" | "won" | "lost";

export type PatternRaceBetPayload = {
  id: string;
  casinoId: string;
  playerId: string;
  walletId: string;
  cycleIndex: number;
  patternId: string;
  kind: PatternRaceBetKind;
  amount: number;
  status: PatternRaceBetStatus;
  payout: number;
  betBatchId: string;
  payoutBatchId: string | null;
  createdAt: string;
  settledAt: string | null;
  /** Contexto didáctico: problema de la carrera a la que aplicó la apuesta. */
  problem?: { id: string; statement: string; hint: string };
  /** Solución ideal del problema (patrón con mayor afinidad). */
  ideal?: {
    patternId: string;
    label: string;
    emoji: string;
    bonus: number;
  } | null;
  /** El patrón elegido por el jugador, con su posición final en la carrera. */
  pick?: {
    patternId: string;
    label: string;
    emoji: string;
    bonus: number;
    finalPosition: number;
  } | null;
  /** Ganador de la carrera, para feedback al jugador. */
  winner?: {
    patternId: string;
    label: string;
    emoji: string;
    bonus: number;
  } | null;
};

export type PlaceBetResponse = {
  bet: PatternRaceBetPayload;
  balanceAfter: number;
  replayed: boolean;
};

export async function apiPlacePatternRaceBet(
  accessToken: string,
  casinoId: string,
  data: {
    patternId: string;
    betKind: PatternRaceBetKind;
    amount: number;
    betBatchId: string;
  },
): Promise<PlaceBetResponse> {
  const res = await fetch(`${BASE}/me/casinos/${casinoId}/carrera/bets`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiListMyPatternRaceBets(
  accessToken: string,
  casinoId: string,
  limit = 20,
): Promise<{ bets: PatternRaceBetPayload[] }> {
  const res = await fetch(
    `${BASE}/me/casinos/${casinoId}/carrera/bets?limit=${encodeURIComponent(
      String(limit),
    )}`,
    { headers: authedHeaders(accessToken) },
  );
  if (!res.ok) throw await parseError(res);
  return res.json();
}
