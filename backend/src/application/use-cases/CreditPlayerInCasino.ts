import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import {
  creditPlayerCore,
  validateAmount,
  validateBatchId,
  type CreditPlayerOutcome,
} from "./helpers/creditPlayerCore.js";
import {
  applyCasinoEventMultiplier,
  annotateNoteWithEvents,
} from "./helpers/applyCasinoEventMultiplier.js";

export type CreditPlayerInCasinoInput = {
  casinoId: string;
  playerId: string;
  amount: number;
  batchId: string;
  actorId: string;
  note: string | null;
};

export type CreditPlayerInCasinoResult = {
  batchId: string;
  /** Monto ingresado por el admin/dealer (antes de multiplicadores). */
  amount: number;
  /** Monto efectivamente acreditado al jugador (post-multiplicador). */
  effectiveAmount: number;
  /** Nombres de eventos que duplicaron el monto, si hubo. */
  appliedEvents: string[];
  playerId: string;
  outcome: CreditPlayerOutcome;
};

/**
 * Acredita fichas a un solo jugador en un casino específico. Idempotente por
 * `batchId` via el mismo helper compartido que el bulk-credit. Valida que el
 * jugador exista, esté activo y sea del roster derivado del casino.
 */
export class CreditPlayerInCasinoUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
    private readonly casinoEvents: CasinoEventRepo,
  ) {}

  async execute(
    input: CreditPlayerInCasinoInput,
  ): Promise<CreditPlayerInCasinoResult> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    if (!casino.active) throw AuthError.casinoArchived();
    if (casino.subastaActive) throw AuthError.casinoInSubasta();

    const amountErr = validateAmount(input.amount);
    if (amountErr) throw AuthError.validation(amountErr);

    const batchErr = validateBatchId(input.batchId);
    if (batchErr) throw AuthError.validation(batchErr);

    if (!input.actorId) throw AuthError.tokenInvalid();

    const player = await this.users.findById(input.playerId);
    if (!player) throw AuthError.validation("player not found");
    if (player.role !== "player") {
      throw AuthError.validation("target user is not a player");
    }
    if (!player.active) throw AuthError.validation("player is archived");
    if (
      player.departamento === null ||
      !casino.departamentos.includes(player.departamento)
    ) {
      throw AuthError.validation(
        "player is not part of this casino's roster",
      );
    }

    const trimmedBatchId = input.batchId.trim();

    // Multiplicador por evento activo (WIN_DOUBLE duplica depósitos). El
    // monto validado es el ingresado; el efectivo puede superar MAX_AMOUNT
    // cuando el evento lo duplica — aceptamos eso como parte del efecto.
    const activeEvents = await this.casinoEvents.listActiveByCasino(
      input.casinoId,
    );
    const boosted = applyCasinoEventMultiplier(
      activeEvents,
      "player_deposit",
      input.amount,
    );
    const noteWithEvents = annotateNoteWithEvents(
      input.note,
      boosted.appliedEventNames,
      boosted.multiplier,
    );

    const outcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        userId: input.playerId,
        amount: boosted.amount,
        batchId: trimmedBatchId,
        actorId: input.actorId,
        note: noteWithEvents,
        kind: "player_deposit",
      },
    );

    return {
      batchId: trimmedBatchId,
      amount: input.amount,
      effectiveAmount: boosted.amount,
      appliedEvents: boosted.appliedEventNames,
      playerId: input.playerId,
      outcome,
    };
  }
}
