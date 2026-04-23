import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import type { ListCasinoPlayersUseCase } from "./ListCasinoPlayers.js";
import {
  creditPlayerCore,
  validateAmount,
  validateBatchId,
} from "./helpers/creditPlayerCore.js";

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
  amount: number;
  creditedCount: number;
  skippedCount: number;
  failedCount: number;
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
  ) {}

  async execute(input: BulkCreditCasinoPlayersInput): Promise<BulkCreditResult> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    if (!casino.active) throw AuthError.casinoArchived();

    const amountErr = validateAmount(input.amount);
    if (amountErr) throw AuthError.validation(amountErr);

    const batchErr = validateBatchId(input.batchId);
    if (batchErr) throw AuthError.validation(batchErr);

    if (!input.actorId) throw AuthError.tokenInvalid();

    const trimmedBatchId = input.batchId.trim();
    const roster = await this.listCasinoPlayers.execute(input.casinoId);

    const playersCredited: string[] = [];
    const playersSkipped: string[] = [];
    const playersFailed: BulkCreditFailure[] = [];

    for (const player of roster) {
      try {
        const outcome = await creditPlayerCore(
          { wallets: this.wallets, walletTxs: this.walletTxs },
          {
            casinoId: input.casinoId,
            playerId: player.id,
            amount: input.amount,
            batchId: trimmedBatchId,
            actorId: input.actorId,
            note: input.note,
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
      creditedCount: playersCredited.length,
      skippedCount: playersSkipped.length,
      failedCount: playersFailed.length,
      totalIssued: playersCredited.length * input.amount,
      playersCredited,
      playersSkipped,
      playersFailed,
    };
  }
}
