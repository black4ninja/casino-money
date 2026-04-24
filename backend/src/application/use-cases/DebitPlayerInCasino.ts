import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import {
  creditPlayerCore,
  validateAmount,
  validateBatchId,
  type CreditPlayerOutcome,
} from "./helpers/creditPlayerCore.js";

export type DebitPlayerInCasinoInput = {
  casinoId: string;
  playerId: string;
  /** Monto positivo a cobrar. Internamente se aplica con signo negativo. */
  amount: number;
  batchId: string;
  actorId: string;
  note: string | null;
};

export type DebitPlayerInCasinoResult = {
  batchId: string;
  amount: number;
  playerId: string;
  outcome: CreditPlayerOutcome;
};

/**
 * Cobra (extrae) fichas de un jugador en un casino específico. Idempotente
 * por `batchId` vía el mismo helper compartido que el depósito. Reutiliza
 * las mismas validaciones de amount/batchId/roster del depósito, pero
 * adicionalmente verifica que el jugador tenga saldo suficiente ANTES de
 * aplicar el débito — si no alcanza, se rechaza sin crear tx.
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
  ) {}

  async execute(
    input: DebitPlayerInCasinoInput,
  ): Promise<DebitPlayerInCasinoResult> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    if (!casino.active) throw AuthError.casinoArchived();

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

    // Valida saldo suficiente. `creditPlayerCore` no bloquea negativos (lo
    // aplica con `.increment` directo), así que es responsabilidad del caller
    // evitar dejar al jugador con saldo negativo.
    const wallet = await this.wallets.findByCasinoAndPlayer(
      input.casinoId,
      input.playerId,
    );
    const currentBalance = wallet?.balance ?? 0;
    if (currentBalance < input.amount) {
      throw AuthError.validation(
        `Saldo insuficiente: jugador tiene $${currentBalance}, se intentó cobrar $${input.amount}.`,
      );
    }

    const trimmedBatchId = input.batchId.trim();
    const outcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        playerId: input.playerId,
        amount: -input.amount, // signo negativo aplica débito
        batchId: trimmedBatchId,
        actorId: input.actorId,
        note: input.note,
        kind: "player_debit",
      },
    );

    return {
      batchId: trimmedBatchId,
      amount: input.amount,
      playerId: input.playerId,
      outcome,
    };
  }
}
