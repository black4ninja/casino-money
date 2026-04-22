import { getBackendBaseURL } from "./parse";
import type { AuthRecord, AuthUser } from "@/storage/auth";

const BASE = `${getBackendBaseURL()}/api/v1`;

export type ApiError = { status: number; code?: string; message: string };

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

export async function apiLogin(
  matricula: string,
  password: string,
): Promise<AuthRecord> {
  const url = `${BASE}/auth/login`;
  console.info("[auth] POST", url, { matricula, passwordLength: password.length });
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, password }),
    });
  } catch (err) {
    console.error("[auth] fetch failed (network/cors):", err);
    throw { status: 0, message: "No se pudo contactar al servidor" } as ApiError;
  }
  console.info("[auth] response status:", res.status);
  if (!res.ok) {
    const e = await parseError(res);
    console.warn("[auth] login rejected:", e);
    throw e;
  }
  return res.json();
}

export async function apiRefresh(refreshToken: string): Promise<AuthRecord> {
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiLogout(
  refreshToken: string,
  accessToken: string,
): Promise<void> {
  await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function apiMe(accessToken: string): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export type UserCollection = "masters" | "dealers" | "players";

export async function apiListUsers(
  accessToken: string,
  collection: UserCollection,
): Promise<{ users: AuthUser[] }> {
  const res = await fetch(`${BASE}/users/${collection}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function apiCreateUser(
  accessToken: string,
  collection: UserCollection,
  data: { matricula: string; password: string; fullName?: string },
): Promise<{ user: AuthUser }> {
  const res = await fetch(`${BASE}/users/${collection}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
