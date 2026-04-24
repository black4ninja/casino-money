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
import { calcDealerCommission } from "./helpers/dealerCommission.js";

export type DebitPlayerInCasinoInput = {
  casinoId: string;
  playerId: string;
  /** Monto positivo a cobrar. Internamente se aplica con signo negativo. */
  amount: number;
  batchId: string;
  actorId: string;
  note: string | null;
};

export type DealerCommissionSummary = {
  dealerId: string;
  amount: number;
  outcome: CreditPlayerOutcome;
};

export type DebitPlayerInCasinoResult = {
  batchId: string;
  /** Monto ingresado por el admin/dealer (antes de multiplicadores). */
  amount: number;
  /** Monto efectivamente cobrado al jugador (post-multiplicador, positivo). */
  effectiveAmount: number;
  /** Nombres de eventos que duplicaron el cobro, si hubo. */
  appliedEvents: string[];
  playerId: string;
  outcome: CreditPlayerOutcome;
  /**
   * Comisión acreditada al dealer que ejecutó el cobro. Null cuando el actor
   * no es dealer (masters no reciben comisión) o cuando la comisión calculada
   * es 0 (cobros pequeños que redondean a cero).
   */
  dealerCommission: DealerCommissionSummary | null;
};

/**
 * Cobra (extrae) fichas de un jugador en un casino específico. Idempotente
 * por `batchId` vía el mismo helper compartido que el depósito. Reutiliza
 * las mismas validaciones de amount/batchId/roster del depósito, pero
 * adicionalmente verifica que el jugador tenga saldo suficiente ANTES de
 * aplicar el débito — si no alcanza, se rechaza sin crear tx.
 *
 * Comisión del dealer: cuando el actor es un dealer (no master), un 20%
 * del cobro efectivo (redondeado a múltiplos de 100) se acredita al wallet
 * personal del dealer en el mismo casino, con kind=dealer_commission. Esto
 * le permite acumular saldo para participar en subastas sin inflar la
 * economía del juego — el 80% restante del cobro se sigue destruyendo.
 *
 * Casos de uso: canje de premios físicos, penalizaciones, correcciones de
 * saldo por parte de tallador o master durante la jornada.
 */
export class DebitPlayerInCasinoUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
    private readonly casinoEvents: CasinoEventRepo,
  ) {}

  async execute(
    input: DebitPlayerInCasinoInput,
  ): Promise<DebitPlayerInCasinoResult> {
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

    // Multiplicador por evento activo (LOSS_DOUBLE duplica cobros). El monto
    // se pasa con signo negativo al helper; si aplica el evento, queda aún
    // más negativo. El saldo se valida contra el monto EFECTIVO.
    const activeEvents = await this.casinoEvents.listActiveByCasino(
      input.casinoId,
    );
    const boosted = applyCasinoEventMultiplier(
      activeEvents,
      "player_debit",
      -input.amount,
    );
    const effectiveCharge = Math.abs(boosted.amount);
    const noteWithEvents = annotateNoteWithEvents(
      input.note,
      boosted.appliedEventNames,
      boosted.multiplier,
    );

    // Valida saldo suficiente contra el monto efectivo. `creditPlayerCore`
    // no bloquea negativos (lo aplica con `.increment` directo), así que es
    // responsabilidad del caller evitar dejar al jugador con saldo negativo.
    const wallet = await this.wallets.findByCasinoAndUser(
      input.casinoId,
      input.playerId,
    );
    const currentBalance = wallet?.balance ?? 0;
    if (currentBalance < effectiveCharge) {
      const suffix =
        boosted.appliedEventNames.length > 0
          ? ` (evento ${boosted.appliedEventNames.join(", ")} x${boosted.multiplier} lo elevó a $${effectiveCharge})`
          : "";
      throw AuthError.validation(
        `Saldo insuficiente: jugador tiene $${currentBalance}, se intentó cobrar $${input.amount}${suffix}.`,
      );
    }

    const trimmedBatchId = input.batchId.trim();
    const outcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        userId: input.playerId,
        amount: boosted.amount, // ya es negativo (y eventualmente duplicado)
        batchId: trimmedBatchId,
        actorId: input.actorId,
        note: noteWithEvents,
        kind: "player_debit",
      },
    );

    // Acredita comisión al dealer SOLO si el débito del jugador fue exitoso
    // (o ya estaba committed via idempotencia). Si el débito falló, no
    // queremos regalar comisión sin que haya salido dinero del jugador.
    const dealerCommission = await this.maybeCreditDealerCommission({
      casinoId: input.casinoId,
      actorId: input.actorId,
      playerId: input.playerId,
      effectiveCharge,
      batchId: trimmedBatchId,
      playerOutcome: outcome,
      playerAlias: player.alias ?? player.fullName ?? player.matricula,
    });

    return {
      batchId: trimmedBatchId,
      amount: input.amount,
      effectiveAmount: effectiveCharge,
      appliedEvents: boosted.appliedEventNames,
      playerId: input.playerId,
      outcome,
      dealerCommission,
    };
  }

  private async maybeCreditDealerCommission(params: {
    casinoId: string;
    actorId: string;
    playerId: string;
    effectiveCharge: number;
    batchId: string;
    playerOutcome: CreditPlayerOutcome;
    playerAlias: string;
  }): Promise<DealerCommissionSummary | null> {
    // Solo si el débito al jugador quedó firme (nuevo o idempotente).
    // Un `failed` NO debe traducirse en comisión al dealer.
    if (
      params.playerOutcome.status !== "credited" &&
      params.playerOutcome.status !== "skipped" &&
      params.playerOutcome.status !== "recovered"
    ) {
      return null;
    }

    const commission = calcDealerCommission(params.effectiveCharge);
    if (commission <= 0) return null;

    const actor = await this.users.findById(params.actorId);
    // Masters no reciben comisión (no son operadores de mesa).
    // Si el actor no es encontrable o está inactivo, tampoco comisionamos.
    if (!actor || !actor.active || actor.role !== "dealer") {
      return null;
    }

    const outcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: params.casinoId,
        userId: actor.id,
        amount: commission,
        batchId: params.batchId,
        actorId: params.actorId,
        note: `Comisión 20% por cobro a ${params.playerAlias} ($${params.effectiveCharge})`,
        kind: "dealer_commission",
        // Mismo batchId que el player_debit, pero distinto keySuffix →
        // idempotencyKey distinto. Retries del cobro reusan esta llave y
        // no duplican comisión.
        keySuffix: "dealer_commission",
      },
    );

    return {
      dealerId: actor.id,
      amount: commission,
      outcome,
    };
  }
}
