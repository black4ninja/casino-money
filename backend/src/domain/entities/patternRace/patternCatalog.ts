/**
 * Catálogo didáctico de la Carrera de Patrones. Fuente de verdad en el
 * backend; el frontend re-declara etiquetas paralelas para render, pero la
 * simulación (outcome, bonuses, payouts) vive SIEMPRE aquí para que nadie
 * pueda adivinar ni manipular resultados desde el cliente.
 *
 * Tema pedagógico: cada carrera plantea un problema de diseño y los patrones
 * que compiten ganan o pierden según qué tan bien lo resuelven (afinidad).
 * Los alumnos aprenden "no hay patrón universal, depende del problema".
 */

export type PatternId =
  | "singleton"
  | "factory"
  | "builder"
  | "observer"
  | "mediator"
  | "strategy"
  | "state"
  | "adapter"
  | "facade"
  | "decorator"
  // Anti-patrones — a veces entran como "dark horses".
  | "god_object"
  | "spaghetti"
  | "copy_paste";

export type PatternKind = "creational" | "behavioral" | "structural" | "anti";

export type PatternSpec = {
  id: PatternId;
  label: string;
  kind: PatternKind;
  /** Emoji/icono corto para render en proyección. */
  emoji: string;
};

export const PATTERNS: readonly PatternSpec[] = [
  { id: "singleton", label: "Singleton", kind: "creational", emoji: "👑" },
  { id: "factory", label: "Factory", kind: "creational", emoji: "🏭" },
  { id: "builder", label: "Builder", kind: "creational", emoji: "🧱" },
  { id: "observer", label: "Observer", kind: "behavioral", emoji: "📡" },
  { id: "mediator", label: "Mediator", kind: "behavioral", emoji: "🕊️" },
  { id: "strategy", label: "Strategy", kind: "behavioral", emoji: "♟️" },
  { id: "state", label: "State", kind: "behavioral", emoji: "🎛️" },
  { id: "adapter", label: "Adapter", kind: "structural", emoji: "🔌" },
  { id: "facade", label: "Facade", kind: "structural", emoji: "🎭" },
  { id: "decorator", label: "Decorator", kind: "structural", emoji: "🎀" },
  { id: "god_object", label: "God Object", kind: "anti", emoji: "💀" },
  { id: "spaghetti", label: "Spaghetti", kind: "anti", emoji: "🍝" },
  { id: "copy_paste", label: "Copy-Paste", kind: "anti", emoji: "📋" },
];

export const PATTERN_IDS: readonly PatternId[] = PATTERNS.map((p) => p.id);

export function findPattern(id: string): PatternSpec | null {
  return PATTERNS.find((p) => p.id === id) ?? null;
}

export function isPatternId(value: unknown): value is PatternId {
  return (
    typeof value === "string" && (PATTERN_IDS as readonly string[]).includes(value)
  );
}

export type ProblemId =
  | "mass_creation"
  | "single_instance"
  | "step_by_step_build"
  | "event_broadcast"
  | "module_coordination"
  | "algorithm_swap"
  | "lifecycle_states"
  | "integrate_legacy"
  | "simplify_subsystem"
  | "dynamic_behavior_add";

export type ProblemSpec = {
  id: ProblemId;
  /** Enunciado corto para proyección. */
  statement: string;
  /** Tip didáctico (ok revelarlo después del "¿quién creen que gana?"). */
  hint: string;
  /**
   * Tabla de afinidad: bonus sumado a cada tick de cada patrón. Entre mayor,
   * más rápido avanza. Un patrón ausente de la tabla recibe bonus 0.
   *
   * Diseño: 0..+5. El "ideal" va a +5, el "buen segundo" a +3-4, y los
   * mismatches se quedan en 0 (solo azar). Anti-patrones aparecen con bonus
   * alto pero con penalización (ver computeRace).
   */
  bonuses: Partial<Record<PatternId, number>>;
};

export const PROBLEMS: readonly ProblemSpec[] = [
  {
    id: "mass_creation",
    statement: "Necesitas crear muchos objetos de tipos relacionados sin acoplar el código que los usa.",
    hint: "Suena a fábrica.",
    bonuses: { factory: 5, builder: 3, singleton: 1, decorator: 1 },
  },
  {
    id: "single_instance",
    statement: "Requieres una única instancia global coordinando el sistema.",
    hint: "Uno y solo uno.",
    bonuses: { singleton: 5, facade: 2, mediator: 2 },
  },
  {
    id: "step_by_step_build",
    statement: "Debes armar un objeto complejo en múltiples pasos con variantes.",
    hint: "Paso a paso.",
    bonuses: { builder: 5, factory: 3, decorator: 2 },
  },
  {
    id: "event_broadcast",
    statement: "Muchos componentes deben reaccionar cuando cambia un estado.",
    hint: "Suscríbete.",
    bonuses: { observer: 5, mediator: 3, state: 1 },
  },
  {
    id: "module_coordination",
    statement: "Módulos distintos se hablan demasiado; hay que centralizar la coordinación.",
    hint: "Un árbitro.",
    bonuses: { mediator: 5, facade: 3, observer: 2 },
  },
  {
    id: "algorithm_swap",
    statement: "Necesitas cambiar el algoritmo en tiempo de ejecución sin condicionales gigantes.",
    hint: "Intercambiable.",
    bonuses: { strategy: 5, state: 3, factory: 1 },
  },
  {
    id: "lifecycle_states",
    statement: "El comportamiento debe cambiar según el estado interno del objeto.",
    hint: "Transiciones limpias.",
    bonuses: { state: 5, strategy: 3, observer: 1 },
  },
  {
    id: "integrate_legacy",
    statement: "Debes integrar un sistema con una interfaz incompatible sin tocar el viejo.",
    hint: "Traductor.",
    bonuses: { adapter: 5, facade: 3, decorator: 1 },
  },
  {
    id: "simplify_subsystem",
    statement: "Un subsistema enorme necesita una puerta de entrada simple para el resto.",
    hint: "Fachada.",
    bonuses: { facade: 5, mediator: 3, adapter: 2 },
  },
  {
    id: "dynamic_behavior_add",
    statement: "Quieres añadir responsabilidades a objetos dinámicamente sin herencia explosiva.",
    hint: "Envuélvelo.",
    bonuses: { decorator: 5, strategy: 3, adapter: 2 },
  },
];

export const PROBLEM_IDS: readonly ProblemId[] = PROBLEMS.map((p) => p.id);

export function findProblem(id: string): ProblemSpec | null {
  return PROBLEMS.find((p) => p.id === id) ?? null;
}

/**
 * Devuelve el patrón con MAYOR afinidad para un problema — la "respuesta
 * canónica" didáctica. Útil para feedback post-apuesta: "el problema era X,
 * la mejor respuesta era Y". Devuelve null si el problema no tiene bonuses
 * (edge case que no debería pasar en el catálogo actual).
 */
export function idealPatternForProblem(
  problem: ProblemSpec,
): { pattern: PatternSpec; bonus: number } | null {
  let best: { pattern: PatternSpec; bonus: number } | null = null;
  for (const [patternId, bonus] of Object.entries(problem.bonuses)) {
    if (typeof bonus !== "number") continue;
    const spec = findPattern(patternId);
    if (!spec) continue;
    if (!best || bonus > best.bonus) best = { pattern: spec, bonus };
  }
  return best;
}

/**
 * Niveles de apuesta. Más bajos que la tragamonedas ($100/$200/$500) a
 * propósito: la carrera es una actividad pasiva para quien no tiene mucho
 * tiempo o solo quiere mirar. No debería mover el saldo del jugador demasiado.
 */
export const CARRERA_BET_LEVELS = [50, 100, 200] as const;
export type CarreraBetLevel = (typeof CARRERA_BET_LEVELS)[number];

export function isCarreraBetLevel(value: unknown): value is CarreraBetLevel {
  return (
    typeof value === "number" &&
    (CARRERA_BET_LEVELS as readonly number[]).includes(value)
  );
}

/**
 * Ciclo por casino: cada carrera dura 2:30 min y entre carreras hay 2:30 min
 * de ventana de apuestas (y resultado). Total por ciclo = 5:00 = 300s.
 *
 * Distribución del ciclo (t en segundos desde inicio de ciclo):
 *   [0, 150)   → BETTING: apuestas abiertas para ESTA carrera. Se muestra el
 *                resultado de la carrera anterior (ciclo-1) al inicio.
 *   [150, 300) → RACING: carrera en curso (2:30 min), apuestas cerradas.
 *
 * La "carrera N" se define como el tramo RACING que inicia en cycleStart+150s
 * y termina en cycleStart+300s. Las apuestas colocadas durante el BETTING del
 * ciclo aplican a la carrera de ESE mismo ciclo.
 */
export const CARRERA_CYCLE_MS = 300_000;
export const CARRERA_BETTING_MS = 150_000;
export const CARRERA_RACING_MS = CARRERA_CYCLE_MS - CARRERA_BETTING_MS;

/** Pista en "pasos" enteros. Más largo = más drama, menos = más ticks visibles. */
export const CARRERA_TRACK_STEPS = 60;

/** Tipo de ganador. Top 3 para mostrar podio y resolver apuestas de ganador/podio. */
export type CarreraPosition = 1 | 2 | 3;

/**
 * Multiplicadores de payout según afinidad del patrón ganador (para apuesta
 * "WIN"). El cap busca un RTP ~85-90% (similar a la tragamonedas). Diseño:
 *
 *   - Favorito fuerte (bonus 5): 1.6x → poca recompensa, pero probable.
 *   - Buen segundo (bonus 3-4): 2.5x → balance.
 *   - Mediocre (bonus 1-2): 4x     → underdog razonable.
 *   - Mismatch puro (bonus 0): 7x   → dark horse.
 *   - Anti-patrón: 10x             → caballo loco, casi nunca gana pero paga.
 *
 * Para apuesta "PODIO" (top 3) los multiplicadores se dividen aproximadamente
 * entre 2 (ver settleBet).
 */
export function winMultiplierForBonus(bonus: number, isAnti: boolean): number {
  if (isAnti) return 10;
  if (bonus >= 5) return 1.6;
  if (bonus >= 3) return 2.5;
  if (bonus >= 1) return 4;
  return 7;
}

export function podiumMultiplierForBonus(bonus: number, isAnti: boolean): number {
  // Podio paga ~40% de lo que pagaría un WIN: mucho más probable que atinar al #1.
  const raw = winMultiplierForBonus(bonus, isAnti) * 0.4;
  // Mínimo 1.2x para que siempre valga la pena contra el riesgo de perder.
  return Math.max(1.2, Math.round(raw * 10) / 10);
}

export type BetKind = "win" | "podium";

export const BET_KINDS: readonly BetKind[] = ["win", "podium"];

export function isBetKind(value: unknown): value is BetKind {
  return typeof value === "string" && (BET_KINDS as readonly string[]).includes(value);
}
