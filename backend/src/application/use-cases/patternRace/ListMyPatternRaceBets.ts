import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { PatternRaceBetRepo } from "../../../domain/ports/PatternRaceBetRepo.js";
import type { PatternRaceBet } from "../../../domain/entities/PatternRaceBet.js";
import { AuthError } from "../../../domain/errors/AuthError.js";
import type { Role } from "../../../domain/entities/Role.js";
import type { SettlePatternRaceBetsUseCase } from "./SettlePatternRaceBets.js";
import { cycleIndexForTime } from "./computeRace.js";

export type ListMyPatternRaceBetsInput = {
  actorId: string;
  actorRole: Role;
  casinoId: string;
  limit?: number;
};

export type ListMyPatternRaceBetsResult = {
  bets: PatternRaceBet[];
};

/**
 * Lista apuestas recientes del jugador en un casino. Antes de responder
 * dispara settle lazy sobre el ciclo anterior (y el actual si ya terminó
 * racing), para que el usuario vea sus apuestas ya resueltas al volver a
 * la vista.
 */
export class ListMyPatternRaceBetsUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly bets: PatternRaceBetRepo,
    private readonly settleBets: SettlePatternRaceBetsUseCase,
  ) {}

  async execute(
    input: ListMyPatternRaceBetsInput,
  ): Promise<ListMyPatternRaceBetsResult> {
    if (input.actorRole !== "player" && input.actorRole !== "dealer") {
      throw AuthError.validation(
        "solo jugadores y dealers pueden ver sus apuestas",
      );
    }
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");

    // Liquida el ciclo inmediatamente anterior al actual. Así si el jugador
    // abre la vista justo después de que acabe una carrera, sus apuestas
    // aparecen ya resueltas.
    const now = Date.now();
    const currentCycle = cycleIndexForTime(now);
    if (currentCycle > 0) {
      try {
        await this.settleBets.execute({
          casinoId: input.casinoId,
          cycleIndex: currentCycle - 1,
        });
      } catch (err) {
        console.warn(
          `[carrera] settle failed casino=${input.casinoId} cycle=${currentCycle - 1}:`,
          err,
        );
      }
    }

    const limit = Math.max(1, Math.min(100, input.limit ?? 20));
    const bets = await this.bets.listRecentByCasinoAndPlayer(
      input.casinoId,
      input.actorId,
      limit,
    );
    return { bets };
  }
}
