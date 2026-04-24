import type { PatternRaceBet } from "../entities/PatternRaceBet.js";
import type { BetKind, PatternId } from "../entities/patternRace/patternCatalog.js";

export type CreatePatternRaceBetInput = {
  casinoId: string;
  playerId: string;
  walletId: string;
  cycleIndex: number;
  patternId: PatternId;
  kind: BetKind;
  amount: number;
  betBatchId: string;
};

export type SettlePatternRaceBetInput = {
  id: string;
  status: "won" | "lost";
  payout: number;
  payoutBatchId: string | null;
};

export interface PatternRaceBetRepo {
  create(input: CreatePatternRaceBetInput): Promise<PatternRaceBet>;
  findById(id: string): Promise<PatternRaceBet | null>;
  findByBetBatchId(betBatchId: string): Promise<PatternRaceBet | null>;
  /**
   * Cuenta las apuestas abiertas (status=open) de un jugador en un ciclo
   * dado de un casino. Usado para rate-limit por ciclo.
   */
  countOpenForPlayerAndCycle(
    casinoId: string,
    playerId: string,
    cycleIndex: number,
  ): Promise<number>;
  /** Lista TODAS las apuestas abiertas de un ciclo en un casino (para liquidar). */
  listOpenByCasinoAndCycle(
    casinoId: string,
    cycleIndex: number,
  ): Promise<PatternRaceBet[]>;
  /** Historial reciente de un jugador en un casino (descendente por creación). */
  listRecentByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
    limit?: number,
  ): Promise<PatternRaceBet[]>;
  /** Marca la apuesta como resuelta. status=won o lost. */
  settle(input: SettlePatternRaceBetInput): Promise<PatternRaceBet>;
}
