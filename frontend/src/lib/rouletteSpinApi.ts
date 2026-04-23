import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";

const BASE = `${getBackendBaseURL()}/api/v1`;

export type RouletteSpin = {
  id: string;
  mesaId: string;
  talladorId: string;
  patternId: string;
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

export async function apiRecordRouletteSpin(
  accessToken: string,
  mesaId: string,
  patternId: string,
): Promise<{ spin: RouletteSpin }> {
  const res = await fetch(`${BASE}/mesas/${mesaId}/spins`, {
    method: "POST",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify({ patternId }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiGetLastRouletteSpin(
  accessToken: string,
  mesaId: string,
): Promise<{ spin: RouletteSpin | null }> {
  const res = await fetch(`${BASE}/mesas/${mesaId}/spins/last`, {
    headers: authedHeaders(accessToken),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
