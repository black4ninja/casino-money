import type { PatternRaceBetRepo } from "../../../domain/ports/PatternRaceBetRepo.js";
import type { WalletRepo } from "../../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../../domain/ports/WalletTransactionRepo.js";
import type { CasinoEventRepo } from "../../../domain/ports/CasinoEventRepo.js";
import type { PatternRaceBet } from "../../../domain/entities/PatternRaceBet.js";
import {
  podiumMultiplierForBonus,
  winMultiplierForBonus,
} from "../../../domain/entities/patternRace/patternCatalog.js";
import { computeRace, type RaceContestant } from "./computeRace.js";
import { creditPlayerCore } from "../helpers/creditPlayerCore.js";
import {
  applyCasinoEventMultiplier,
  annotateNoteWithEvents,
} from "../helpers/applyCasinoEventMultiplier.js";

export type SettlePatternRaceBetsInput = {
  casinoId: string;
  /** Ciclo cuya carrera YA terminó (los callers sólo deberían pasar ciclos cerrados). */
  cycleIndex: number;
};

export type SettlePatternRaceBetsResult = {
  settled: number;
  won: number;
  lost: number;
  paidOut: number;
};

/**
 * Liquida todas las apuestas abiertas de un ciclo cuya carrera ya terminó.
 * Idempotente: si una apuesta ya está resuelta, se salta. Si el crédito del
 * payout ya se aplicó (vía idempotencyKey del WalletTransaction) no se
 * duplica.
 *
 * Diseño pragmático: este use case se ejecuta LAZY al inicio de cada
 * snapshotRace / ListMyPatternRaceBets, para ciclos previos no liquidados.
 * No hay background worker.
 */
export class SettlePatternRaceBetsUseCase {
  constructor(
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
    private readonly bets: PatternRaceBetRepo,
    private readonly casinoEvents: CasinoEventRepo,
  ) {}

  async execute(
    input: SettlePatternRaceBetsInput,
  ): Promise<SettlePatternRaceBetsResult> {
    const open = await this.bets.listOpenByCasinoAndCycle(
      input.casinoId,
      input.cycleIndex,
    );
    if (open.length === 0) {
      return { settled: 0, won: 0, lost: 0, paidOut: 0 };
    }

    const blueprint = computeRace(input.casinoId, input.cycleIndex);
    const byPattern = new Map<string, RaceContestant>();
    for (const c of blueprint.contestants) byPattern.set(c.patternId, c);

    // Lee una sola vez los eventos activos del casino para aplicar el mismo
    // estado a todas las apuestas del ciclo — evita race donde el admin
    // desactive CARRERA_DOUBLE a mitad del settle y unos ganadores cobren
    // doble y otros no.
    const activeEvents = await this.casinoEvents.listActiveByCasino(
      input.casinoId,
    );

    let won = 0;
    let lost = 0;
    let paidOut = 0;

    for (const bet of open) {
      const contestant = byPattern.get(bet.patternId);
      if (!contestant) {
        // No debería pasar (el patrón sí estaba al colocar la apuesta), pero
        // si el catálogo cambió entre versiones devolvemos al jugador.
        await this.refund(bet);
        lost += 1; // Registro como "lost" por simpleza; el ledger tiene el reembolso.
        continue;
      }
      const winsWin = contestant.finalPosition === 1;
      const winsPodium = contestant.finalPosition <= 3;
      const pickHits =
        bet.kind === "win" ? winsWin : winsPodium;

      if (!pickHits) {
        await this.bets.settle({
          id: bet.id,
          status: "lost",
          payout: 0,
          payoutBatchId: null,
        });
        lost += 1;
        continue;
      }

      const isAnti = contestant.kind === "anti";
      const multiplier =
        bet.kind === "win"
          ? winMultiplierForBonus(contestant.bonus, isAnti)
          : podiumMultiplierForBonus(contestant.bonus, isAnti);
      const basePayout = Math.max(0, Math.round(bet.amount * multiplier));

      // Aplica CARRERA_DOUBLE si está activo. El `payout` persistido en la
      // apuesta refleja el monto final (boosted) para que la historia del
      // jugador muestre lo que realmente recibió.
      const boosted = applyCasinoEventMultiplier(
        activeEvents,
        "carrera_payout",
        basePayout,
      );
      const payout = boosted.amount;

      // Crédito idempotente con su propio key suffix; usamos el betBatchId
      // como batchId base para trazabilidad y un suffix propio para distinguir
      // del débito original.
      const baseNote = `carrera payout ${multiplier}x (${bet.kind}) cycle=${bet.cycleIndex} winner=${contestant.patternId}`;
      const noteWithEvents = annotateNoteWithEvents(
        baseNote,
        boosted.appliedEventNames,
        boosted.multiplier,
      );
      const credit = await creditPlayerCore(
        { wallets: this.wallets, walletTxs: this.walletTxs },
        {
          casinoId: bet.casinoId,
          playerId: bet.playerId,
          amount: payout,
          batchId: bet.betBatchId,
          actorId: bet.playerId,
          note: noteWithEvents,
          kind: "carrera_payout",
          keySuffix: "payout",
        },
      );
      if (credit.status === "failed") {
        // Dejar la apuesta abierta para reintento posterior; el admin puede
        // revisar por qué el crédito falló.
        console.warn(
          `[carrera] payout credit failed bet=${bet.id}: ${credit.reason}`,
        );
        continue;
      }

      await this.bets.settle({
        id: bet.id,
        status: "won",
        payout,
        payoutBatchId: `${bet.betBatchId}:payout`,
      });
      won += 1;
      paidOut += payout;
    }

    return { settled: won + lost, won, lost, paidOut };
  }

  private async refund(bet: PatternRaceBet): Promise<void> {
    await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: bet.casinoId,
        playerId: bet.playerId,
        amount: bet.amount,
        batchId: bet.betBatchId,
        actorId: bet.playerId,
        note: `carrera refund (pattern no longer in catalog) cycle=${bet.cycleIndex}`,
        kind: "carrera_payout",
        keySuffix: "refund",
      },
    );
    await this.bets.settle({
      id: bet.id,
      status: "lost",
      payout: 0,
      payoutBatchId: `${bet.betBatchId}:refund`,
    });
  }
}
