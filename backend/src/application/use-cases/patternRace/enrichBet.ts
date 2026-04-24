import type { PatternRaceBet } from "../../../domain/entities/PatternRaceBet.js";
import { idealPatternForProblem } from "../../../domain/entities/patternRace/patternCatalog.js";
import { computeRace } from "./computeRace.js";

/**
 * Serializa una apuesta agregando contexto didáctico: el problema de la
 * carrera a la que aplicó y la solución ideal (patrón con mayor afinidad).
 * Esto le permite al jugador aprender "cuál era la mejor respuesta" incluso
 * cuando perdió — el loop pedagógico del juego.
 *
 * El enriquecimiento es barato: computeRace es determinista en memoria.
 */
export function enrichBet(bet: PatternRaceBet) {
  const race = computeRace(bet.casinoId, bet.cycleIndex);
  const ideal = idealPatternForProblem(race.problem);
  const pickContestant = race.contestants.find(
    (c) => c.patternId === bet.patternId,
  );
  const winner =
    [...race.contestants].sort((a, b) => a.finalPosition - b.finalPosition)[0] ??
    null;
  return {
    ...bet.toPublic(),
    problem: {
      id: race.problem.id,
      statement: race.problem.statement,
      hint: race.problem.hint,
    },
    ideal: ideal
      ? {
          patternId: ideal.pattern.id,
          label: ideal.pattern.label,
          emoji: ideal.pattern.emoji,
          bonus: ideal.bonus,
        }
      : null,
    pick: pickContestant
      ? {
          patternId: pickContestant.patternId,
          label: pickContestant.label,
          emoji: pickContestant.emoji,
          bonus: pickContestant.bonus,
          finalPosition: pickContestant.finalPosition,
        }
      : null,
    winner: winner
      ? {
          patternId: winner.patternId,
          label: winner.label,
          emoji: winner.emoji,
          bonus: winner.bonus,
        }
      : null,
  };
}

export type EnrichedBetPayload = ReturnType<typeof enrichBet>;
