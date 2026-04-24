import { createHash } from "node:crypto";
import {
  CARRERA_BETTING_MS,
  CARRERA_CYCLE_MS,
  CARRERA_RACING_MS,
  CARRERA_TRACK_STEPS,
  PATTERNS,
  PROBLEMS,
  type PatternId,
  type PatternSpec,
  type ProblemSpec,
} from "../../../domain/entities/patternRace/patternCatalog.js";

/**
 * Motor determinista de la Carrera de Patrones. Dado (casinoId, cycleIndex)
 * cualquier proceso calcula exactamente:
 *   - Problema de la carrera.
 *   - 6 concursantes (patrones + opcionalmente 1 anti-patrón como "dark horse").
 *   - Bonus de afinidad de cada concursante.
 *   - Finish time (ms desde inicio de la carrera) y posición final 1..6.
 *
 * No hay persistencia del outcome: se recomputa siempre. Así evitamos montar
 * un worker de fondo (el codebase no tiene ninguno) y garantizamos que el
 * cliente de proyección, el backend y el cliente del jugador vean lo MISMO
 * aunque se conecten en distintos momentos.
 *
 * La semilla = sha256(`${casinoId}:${cycleIndex}`) → bytes estables. Con eso
 * alimentamos un PRNG determinista xorshift32.
 */

export type RaceContestant = {
  patternId: PatternId;
  label: string;
  emoji: string;
  kind: PatternSpec["kind"];
  bonus: number;
  /** Tiempo en ms (dentro del tramo RACING) en que el patrón cruza la meta. */
  finishAtMs: number;
  /** Posición final 1..N (1 = ganador). */
  finalPosition: number;
};

export type RaceBlueprint = {
  cycleIndex: number;
  casinoId: string;
  problem: ProblemSpec;
  contestants: RaceContestant[];
  /** Posición inicial del ciclo (epoch ms). */
  cycleStartedAtMs: number;
  /** Inicio del tramo RACING (apuestas cierran aquí). */
  raceStartedAtMs: number;
  /** Fin del tramo RACING (y fin del ciclo). */
  raceEndsAtMs: number;
};

/** Epoch fijo desde el cual enumeramos ciclos. Cualquier valor constante sirve. */
const CARRERA_EPOCH_MS = Date.UTC(2025, 0, 1);

export function cycleIndexForTime(nowMs: number): number {
  const delta = nowMs - CARRERA_EPOCH_MS;
  return Math.floor(delta / CARRERA_CYCLE_MS);
}

export function cycleStartMs(cycleIndex: number): number {
  return CARRERA_EPOCH_MS + cycleIndex * CARRERA_CYCLE_MS;
}

/** xorshift32 determinista a partir de una semilla de 32 bits. */
function makePrng(seed32: number): () => number {
  let state = seed32 >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

/** Deriva 32 bits de una cadena vía sha256 para sembrar el PRNG. */
function seed32FromKey(key: string): number {
  const hash = createHash("sha256").update(key).digest();
  // Primeros 4 bytes como uint32 BE.
  return (
    ((hash[0]! << 24) | (hash[1]! << 16) | (hash[2]! << 8) | hash[3]!) >>> 0
  );
}

/** Elegir N distintos de una lista usando el PRNG (Fisher-Yates parcial). */
function pickDistinct<T>(pool: readonly T[], n: number, rand: () => number): T[] {
  const arr = [...pool];
  const out: T[] = [];
  const take = Math.min(n, arr.length);
  for (let i = 0; i < take; i++) {
    const idx = Math.floor(rand() * arr.length);
    out.push(arr[idx]!);
    arr.splice(idx, 1);
  }
  return out;
}

/**
 * Simula la carrera paso a paso con bonuses de afinidad + azar. El patrón
 * con mejor tiempo gana. Los anti-patrones tienen un bonus base alto pero
 * con "choques": 30% de probabilidad de perder un tick.
 */
export function computeRace(
  casinoId: string,
  cycleIndex: number,
): RaceBlueprint {
  const seedKey = `${casinoId}:${cycleIndex}:carrera-v1`;
  const rand = makePrng(seed32FromKey(seedKey));

  const problem = PROBLEMS[Math.floor(rand() * PROBLEMS.length)]!;

  // 5 patrones no-anti + 1 anti-patrón como dark horse (≈33% de las veces).
  const patternPool = PATTERNS.filter((p) => p.kind !== "anti");
  const antiPool = PATTERNS.filter((p) => p.kind === "anti");
  const includeAnti = rand() < 0.33;
  const contestantSpecs: PatternSpec[] = pickDistinct(
    patternPool,
    includeAnti ? 5 : 6,
    rand,
  );
  if (includeAnti) {
    contestantSpecs.push(pickDistinct(antiPool, 1, rand)[0]!);
  }

  // Simulación: ticks de 1s sobre CARRERA_RACING_MS. En cada tick cada patrón
  // avanza (random 1..6) + bonus_afinidad. Anti-patrones tienen 30% chance de
  // "chocar" y no avanzar. Al llegar a CARRERA_TRACK_STEPS, cruza meta.
  const ticksTotal = Math.floor(CARRERA_RACING_MS / 1000);
  type SimState = {
    spec: PatternSpec;
    bonus: number;
    steps: number;
    finishTickMs: number | null;
  };
  const states: SimState[] = contestantSpecs.map((spec) => ({
    spec,
    bonus: problem.bonuses[spec.id] ?? 0,
    steps: 0,
    finishTickMs: null,
  }));

  // Anti-patrones reciben un bonus "carisma" pero pagan con choques. Esto
  // mantiene el twist narrativo: el God Object empieza fuerte y se descarrila.
  const antiCharismaBonus = 3;

  for (let t = 0; t < ticksTotal; t++) {
    for (const s of states) {
      if (s.finishTickMs !== null) continue;
      const isAnti = s.spec.kind === "anti";
      // Tick: 1..6 + bonus. Anti: misma base pero 30% choca (avanza 0).
      if (isAnti && rand() < 0.3) continue;
      const roll = 1 + Math.floor(rand() * 6);
      const step = roll + s.bonus + (isAnti ? antiCharismaBonus : 0);
      s.steps += step;
      if (s.steps >= CARRERA_TRACK_STEPS) {
        // Marcamos tiempo de meta con sub-tick proporcional al exceso
        // para que dos concursantes que crucen en el mismo tick se
        // desempaten de forma determinista.
        const excess = s.steps - CARRERA_TRACK_STEPS;
        const subTickFraction = Math.min(1, excess / step);
        s.finishTickMs = (t + 1 - subTickFraction) * 1000;
      }
    }
    // Corte temprano cuando TODOS terminaron.
    if (states.every((s) => s.finishTickMs !== null)) break;
  }

  // Quien no cruzó antes del límite de tiempo recibe un tiempo "infinito"
  // proporcional a lo que le faltaba — así mantiene orden determinista.
  for (const s of states) {
    if (s.finishTickMs === null) {
      const remaining = CARRERA_TRACK_STEPS - s.steps;
      s.finishTickMs = CARRERA_RACING_MS + remaining * 1000;
    }
  }

  // Reescalado: la simulación integer-step termina muy rápido (≈10-30s) pero
  // la fase RACING dura 5 min. Sin reescalar, la pista quedaría vacía casi
  // toda la fase. Expandimos los finish times para que ocupen ~[55%, 98%] del
  // total, preservando el ORDEN relativo y la distancia proporcional.
  const rawMin = Math.min(...states.map((s) => s.finishTickMs!));
  const rawMax = Math.max(...states.map((s) => s.finishTickMs!));
  const scaledFrom = CARRERA_RACING_MS * 0.55;
  const scaledTo = CARRERA_RACING_MS * 0.98;
  if (rawMax > rawMin) {
    for (const s of states) {
      const t = (s.finishTickMs! - rawMin) / (rawMax - rawMin);
      s.finishTickMs = scaledFrom + t * (scaledTo - scaledFrom);
    }
  } else {
    // Caso patológico (empate absoluto): todos en el mismo punto medio.
    for (const s of states) {
      s.finishTickMs = (scaledFrom + scaledTo) / 2;
    }
  }

  const ranked = [...states].sort((a, b) => a.finishTickMs! - b.finishTickMs!);
  const contestants: RaceContestant[] = ranked.map((s, idx) => ({
    patternId: s.spec.id,
    label: s.spec.label,
    emoji: s.spec.emoji,
    kind: s.spec.kind,
    bonus: s.bonus,
    finishAtMs: Math.round(s.finishTickMs!),
    finalPosition: idx + 1,
  }));
  // Devolvemos en orden del grid original (para render estable). Frontend
  // ordenará por finalPosition cuando necesite el podio.
  contestants.sort((a, b) => {
    const ai = contestantSpecs.findIndex((p) => p.id === a.patternId);
    const bi = contestantSpecs.findIndex((p) => p.id === b.patternId);
    return ai - bi;
  });

  const cycleStartedAtMs = cycleStartMs(cycleIndex);
  return {
    cycleIndex,
    casinoId,
    problem,
    contestants,
    cycleStartedAtMs,
    raceStartedAtMs: cycleStartedAtMs + CARRERA_BETTING_MS,
    raceEndsAtMs: cycleStartedAtMs + CARRERA_CYCLE_MS,
  };
}

/**
 * Dado un tiempo actual, devuelve:
 *   - El ciclo "actual" y su fase (betting | racing).
 *   - El ciclo "anterior" cuya carrera ya terminó (para mostrar resultado).
 */
export type RaceSnapshot = {
  now: number;
  current: RaceBlueprint;
  phase: "betting" | "racing";
  /** ms restantes en la fase actual (>=0). */
  phaseRemainingMs: number;
  /** ms desde que inició la carrera (negativo si aún no arranca). */
  raceElapsedMs: number;
  /** Resultado de la carrera anterior (cycleIndex - 1). */
  previous: RaceBlueprint | null;
};

export function snapshotRace(casinoId: string, nowMs: number): RaceSnapshot {
  const cycleIndex = cycleIndexForTime(nowMs);
  const current = computeRace(casinoId, cycleIndex);
  const cycleT = nowMs - current.cycleStartedAtMs;
  const phase: "betting" | "racing" =
    cycleT < CARRERA_BETTING_MS ? "betting" : "racing";
  const phaseRemainingMs =
    phase === "betting"
      ? CARRERA_BETTING_MS - cycleT
      : CARRERA_CYCLE_MS - cycleT;
  const raceElapsedMs = cycleT - CARRERA_BETTING_MS;
  const previous =
    cycleIndex > 0 ? computeRace(casinoId, cycleIndex - 1) : null;
  return {
    now: nowMs,
    current,
    phase,
    phaseRemainingMs: Math.max(0, phaseRemainingMs),
    raceElapsedMs,
    previous,
  };
}
