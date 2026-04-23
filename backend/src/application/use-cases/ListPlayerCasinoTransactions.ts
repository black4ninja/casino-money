import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import type { WalletTransaction } from "../../domain/entities/WalletTransaction.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type ListPlayerCasinoTransactionsInput = {
  casinoId: string;
  playerId: string;
  limit?: number;
};

/**
 * Devuelve el historial de movimientos de un jugador dentro de un casino
 * específico, ordenado del más reciente al más viejo. Acotado por `limit`
 * (default 200) — paginar explícitamente si un casino crece más allá.
 */
export class ListPlayerCasinoTransactionsUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly walletTxs: WalletTransactionRepo,
  ) {}

  async execute(
    input: ListPlayerCasinoTransactionsInput,
  ): Promise<WalletTransaction[]> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    const player = await this.users.findById(input.playerId);
    if (!player) throw AuthError.validation("player not found");
    return this.walletTxs.listByCasinoAndPlayer(
      input.casinoId,
      input.playerId,
      input.limit,
    );
  }
}
