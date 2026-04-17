import { create } from "zustand";
import type { Session } from "@/domain/types";
import { clearSession, loadSession, saveSession } from "@/storage/session";

type State = {
  session: Session | null;
  setSession: (s: Session) => void;
  clear: () => void;
};

export const useSessionStore = create<State>((set) => ({
  session: loadSession(),
  setSession: (s) => {
    saveSession(s);
    set({ session: s });
  },
  clear: () => {
    clearSession();
    set({ session: null });
  },
}));
