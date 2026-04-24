/**
 * Constantes espejo del backend para la Carrera de Patrones. El backend es la
 * fuente de verdad del catálogo completo (bonuses, simulación, payouts); aquí
 * solo repetimos lo necesario para la UI (tonos, montos permitidos, labels).
 */

export type PatternKind = "creational" | "behavioral" | "structural" | "anti";
export type PatternRaceBetKind = "win" | "podium";

/** Niveles de apuesta (MXN enteros). Espejo de CARRERA_BET_LEVELS. */
export const CARRERA_BET_LEVELS = [50, 100, 200] as const;
export type CarreraBetLevel = (typeof CARRERA_BET_LEVELS)[number];

/** Etiquetas para la UI. */
export const BET_KIND_LABEL: Record<PatternRaceBetKind, string> = {
  win: "Ganador",
  podium: "Podio (Top 3)",
};

export const BET_KIND_HINT: Record<PatternRaceBetKind, string> = {
  win: "Debe quedar 1° para ganar. Paga más.",
  podium: "Basta con que quede en top 3. Paga menos.",
};

/** Color asociado a cada tipo de patrón (para bandas de color en la pista). */
export const PATTERN_KIND_TONE: Record<PatternKind, string> = {
  creational: "from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-600)]",
  behavioral: "from-[var(--color-chip-green-400)] to-[var(--color-chip-green-600)]",
  structural:
    "from-[var(--color-chip-purple-400)] to-[var(--color-chip-purple-600)]",
  anti: "from-[var(--color-chip-red-400)] to-[var(--color-chip-red-600)]",
};

export const PATTERN_KIND_LABEL: Record<PatternKind, string> = {
  creational: "Creacional",
  behavioral: "Comportamiento",
  structural: "Estructural",
  anti: "Anti-patrón",
};

export const CARRERA_CYCLE_SECONDS = 300;
export const CARRERA_BETTING_SECONDS = 150;
export const CARRERA_RACING_SECONDS = CARRERA_CYCLE_SECONDS - CARRERA_BETTING_SECONDS;

export function formatMsRemaining(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
