import type { AppUser } from "../../domain/entities/AppUser.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import type { ListCasinoPlayersUseCase } from "./ListCasinoPlayers.js";

export type CasinoEconomyRow = {
  player: AppUser;
  walletId: string | null;
  balance: number;
  walletActive: boolean;
};

/**
 * Materializa la vista económica del casino: una fila por jugador del roster
 * con su balance actual. Si el jugador aún no tiene wallet (nadie le ha
 * acreditado), el balance es 0 y walletId es null.
 */
export class ListCasinoEconomyWalletsUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly wallets: WalletRepo,
    private readonly listCasinoPlayers: ListCasinoPlayersUseCase,
  ) {}

  async execute(casinoId: string): Promise<CasinoEconomyRow[]> {
    const casino = await this.casinos.findById(casinoId);
    if (!casino) throw AuthError.tokenInvalid();

    const [roster, wallets] = await Promise.all([
      this.listCasinoPlayers.execute(casinoId),
      this.wallets.findByCasino(casinoId),
    ]);

    const byPlayer = new Map<string, { id: string; balance: number; active: boolean }>();
    for (const w of wallets) {
      const prev = byPlayer.get(w.playerId);
      // Si hay duplicados (race de doble-create), preferimos el más viejo
      // consistentemente con WalletRepo.findByCasinoAndPlayer.
      if (!prev) {
        byPlayer.set(w.playerId, { id: w.id, balance: w.balance, active: w.active });
      }
    }

    return roster.map((player) => {
      const w = byPlayer.get(player.id);
      return {
        player,
        walletId: w?.id ?? null,
        balance: w?.balance ?? 0,
        walletActive: w?.active ?? true,
      };
    });
  }
}
