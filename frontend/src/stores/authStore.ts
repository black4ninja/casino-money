import { create } from "zustand";
import type { AuthRecord, AuthUser } from "@/storage/auth";
import { clearAuth, loadAuth, saveAuth } from "@/storage/auth";
import {
  apiLogin,
  apiLogout,
  apiMe,
  apiRefresh,
  type ApiError,
} from "@/lib/authApi";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  login: (matricula: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string>; // returns new access token
  hydrate: () => void;
  setFromRecord: (record: AuthRecord) => void;
  /**
   * Replaces the current user (e.g. after a self-service update like
   * /me/alias) while keeping the existing tokens. Persists to storage so
   * a reload sees the new value.
   */
  setUser: (user: AuthUser) => void;
};

const initial: Pick<AuthState, "user" | "accessToken" | "refreshToken" | "loading"> = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
};

let refreshInFlight: Promise<string> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initial,

  hydrate: () => {
    const rec = loadAuth();
    if (rec) {
      set({
        user: rec.user,
        accessToken: rec.accessToken,
        refreshToken: rec.refreshToken,
      });
    }
  },

  setFromRecord: (record) => {
    saveAuth(record);
    set({
      user: record.user,
      accessToken: record.accessToken,
      refreshToken: record.refreshToken,
    });
  },

  setUser: (user) => {
    const { accessToken, refreshToken } = get();
    if (!accessToken || !refreshToken) {
      set({ user });
      return;
    }
    saveAuth({ user, accessToken, refreshToken });
    set({ user });
  },

  login: async (matricula, password) => {
    set({ loading: true });
    try {
      const record = await apiLogin(matricula, password);
      get().setFromRecord(record);
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    const { refreshToken, accessToken } = get();
    if (refreshToken && accessToken) {
      try {
        await apiLogout(refreshToken, accessToken);
      } catch {
        // best-effort: server may already have revoked, proceed
      }
    }
    clearAuth();
    set({ ...initial });
  },

  refresh: async () => {
    if (refreshInFlight) return refreshInFlight;
    const { refreshToken } = get();
    if (!refreshToken) throw { status: 401, message: "no refresh token" } as ApiError;
    refreshInFlight = (async () => {
      try {
        const record = await apiRefresh(refreshToken);
        get().setFromRecord(record);
        return record.accessToken;
      } finally {
        refreshInFlight = null;
      }
    })();
    return refreshInFlight;
  },
}));

/** Called by a page to verify the server still knows this session. */
export async function verifyStoredSession(): Promise<boolean> {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return false;
  try {
    await apiMe(accessToken);
    return true;
  } catch (err) {
    const e = err as ApiError;
    if (e.status === 401) {
      try {
        await useAuthStore.getState().refresh();
        return true;
      } catch {
        await useAuthStore.getState().logout();
        return false;
      }
    }
    return false;
  }
}
