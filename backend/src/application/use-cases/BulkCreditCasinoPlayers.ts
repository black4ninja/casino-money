import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import type { ListCasinoPlayersUseCase } from "./ListCasinoPlayers.js";
import {
  creditPlayerCore,
  validateAmount,
  validateBatchId,
} from "./helpers/creditPlayerCore.js";
import {
  applyCasinoEventMultiplier,
  annotateNoteWithEvents,
} from "./helpers/applyCasinoEventMultiplier.js";

export type BulkCreditCasinoPlayersInput = {
  casinoId: string;
  amount: number;
  batchId: string;
  actorId: string;
  note: string | null;
};

export type BulkCreditFailure = {
  playerId: string;
  reason: string;
};

export type BulkCreditResult = {
  batchId: string;
  /** Monto ingresado por el admin (antes de multiplicadores). */
  amount: number;
  /** Monto efectivo acreditado por jugador (post-multiplicador). */
  effectiveAmount: number;
  /** Nombres de eventos que duplicaron el reparto, si hubo. */
  appliedEvents: string[];
  creditedCount: number;
  skippedCount: number;
  failedCount: number;
  /** `effectiveAmount * creditedCount`. */
  totalIssued: number;
  playersCredited: string[];
  playersSkipped: string[];
  playersFailed: BulkCreditFailure[];
};

/**
 * Acredita el mismo monto en el monedero de cada jugador activo del roster
 * derivado del casino. Idempotente por `batchId`: reintentar con el mismo
 * `batchId` y amount NO causa doble crédito — el helper compartido
 * `creditPlayerCore` detecta reintentos vía `idempotencyKey`.
 */
export class BulkCreditCasinoPlayersUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
    private readonly listCasinoPlayers: ListCasinoPlayersUseCase,
    private readonly casinoEvents: CasinoEventRepo,
  ) {}

  async execute(input: BulkCreditCasinoPlayersInput): Promise<BulkCreditResult> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    if (!casino.active) throw AuthError.casinoArchived();
    if (casino.subastaActive) throw AuthError.casinoInSubasta();

    const amountErr = validateAmount(input.amount);
    if (amountErr) throw AuthError.validation(amountErr);

    const batchErr = validateBatchId(input.batchId);
    if (batchErr) throw AuthError.validation(batchErr);

    if (!input.actorId) throw AuthError.tokenInvalid();

    const trimmedBatchId = input.batchId.trim();
    const roster = await this.listCasinoPlayers.execute(input.casinoId);

    // Se resuelve el multiplicador UNA vez con el monto ingresado — cada
    // jugador recibe exactamente el mismo amount efectivo. Evita race donde
    // el admin archive el evento a mitad del reparto y algunos jugadores
    // cobren el doble y otros no.
    const activeEvents = await this.casinoEvents.listActiveByCasino(
      input.casinoId,
    );
    const boosted = applyCasinoEventMultiplier(
      activeEvents,
      "global_credit",
      input.amount,
    );
    const noteWithEvents = annotateNoteWithEvents(
      input.note,
      boosted.appliedEventNames,
      boosted.multiplier,
    );

    const playersCredited: string[] = [];
    const playersSkipped: string[] = [];
    const playersFailed: BulkCreditFailure[] = [];

    for (const player of roster) {
      try {
        const outcome = await creditPlayerCore(
          { wallets: this.wallets, walletTxs: this.walletTxs },
          {
            casinoId: input.casinoId,
            userId: player.id,
            amount: boosted.amount,
            batchId: trimmedBatchId,
            actorId: input.actorId,
            note: noteWithEvents,
            kind: "global_credit",
          },
        );
        if (outcome.status === "credited" || outcome.status === "recovered") {
          playersCredited.push(player.id);
        } else if (outcome.status === "skipped") {
          playersSkipped.push(player.id);
        } else {
          playersFailed.push({ playerId: player.id, reason: outcome.reason });
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        playersFailed.push({ playerId: player.id, reason });
      }
    }

    return {
      batchId: trimmedBatchId,
      amount: input.amount,
      effectiveAmount: boosted.amount,
      appliedEvents: boosted.appliedEventNames,
      creditedCount: playersCredited.length,
      skippedCount: playersSkipped.length,
      failedCount: playersFailed.length,
      totalIssued: playersCredited.length * boosted.amount,
      playersCredited,
      playersSkipped,
      playersFailed,
    };
  }
}
