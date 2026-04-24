import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import { AuthError } from "../../../domain/errors/AuthError.js";
import { snapshotRace } from "./computeRace.js";
import type { SettlePatternRaceBetsUseCase } from "./SettlePatternRaceBets.js";

export type GetCurrentPatternRaceInput = {
  casinoId: string;
};

export type GetCurrentPatternRaceResult = {
  casino: { id: string; name: string };
  now: string;
  phase: "betting" | "racing";
  phaseRemainingMs: number;
  current: {
    cycleIndex: number;
    problem: { id: string; statement: string; hint: string };
    contestants: Array<{
      patternId: string;
      label: string;
      emoji: string;
      kind: string;
      bonus: number;
      finishAtMs: number;
      finalPosition: number;
    }>;
    raceStartedAt: string;
    raceEndsAt: string;
    raceElapsedMs: number;
    raceDurationMs: number;
    bettingClosesAt: string;
  };
  previous: GetCurrentPatternRaceResult["current"] | null;
};

/**
 * Devuelve un snapshot determinista del estado de la Carrera de Patrones
 * para un casino. Pensado para una vista pública (proyección) o el panel del
 * jugador.
 *
 * Como efecto colateral, si detecta que el ciclo anterior ya terminó, dispara
 * la liquidación de sus apuestas abiertas (lazy settle). Esto sustituye al
 * worker de fondo: cada llamada garantiza que las apuestas cerradas se
 * resuelvan razonablemente pronto (las vistas polean cada 1-2s).
 */
export class GetCurrentPatternRaceUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly settleBets: SettlePatternRaceBetsUseCase,
  ) {}

  async execute(
    input: GetCurrentPatternRaceInput,
  ): Promise<GetCurrentPatternRaceResult> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.active) throw AuthError.casinoArchived();

    const now = Date.now();
    const snap = snapshotRace(input.casinoId, now);

    // Lazy settle del ciclo anterior (si existe). Fire-and-forget: no esperamos
    // a que termine para responder — el siguiente poll verá las apuestas ya
    // liquidadas. Hacemos await de todos modos porque settle es rápido y
    // queremos consistencia entre snapshot y apuestas.
    if (snap.previous) {
      try {
        await this.settleBets.execute({
          casinoId: input.casinoId,
          cycleIndex: snap.previous.cycleIndex,
        });
      } catch (err) {
        console.warn(
          `[carrera] settle failed casino=${input.casinoId} cycle=${snap.previous.cycleIndex}:`,
          err,
        );
      }
    }

    const raceDurationMs = snap.current.raceEndsAtMs - snap.current.raceStartedAtMs;
    const serialize = (b: typeof snap.current) => ({
      cycleIndex: b.cycleIndex,
      problem: {
        id: b.problem.id,
        statement: b.problem.statement,
        hint: b.problem.hint,
      },
      contestants: b.contestants.map((c) => ({
        patternId: c.patternId,
        label: c.label,
        emoji: c.emoji,
        kind: c.kind,
        bonus: c.bonus,
        finishAtMs: c.finishAtMs,
        finalPosition: c.finalPosition,
      })),
      raceStartedAt: new Date(b.raceStartedAtMs).toISOString(),
      raceEndsAt: new Date(b.raceEndsAtMs).toISOString(),
      raceElapsedMs: Math.max(
        0,
        Math.min(raceDurationMs, now - b.raceStartedAtMs),
      ),
      raceDurationMs,
      bettingClosesAt: new Date(b.raceStartedAtMs).toISOString(),
    });

    return {
      casino: { id: casino.id, name: casino.name },
      now: new Date(now).toISOString(),
      phase: snap.phase,
      phaseRemainingMs: snap.phaseRemainingMs,
      current: serialize(snap.current),
      previous: snap.previous ? serialize(snap.previous) : null,
    };
  }
}
