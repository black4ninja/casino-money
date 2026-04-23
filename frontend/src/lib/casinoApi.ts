import { getBackendBaseURL } from "./parse";
import type { ApiError } from "./authApi";

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
  active: boolean;
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
  data: { name?: string; date?: string },
): Promise<{ casino: Casino }> {
  const res = await fetch(`${BASE}/casinos/${id}`, {
    method: "PATCH",
    headers: authedHeaders(accessToken, true),
    body: JSON.stringify(data),
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
