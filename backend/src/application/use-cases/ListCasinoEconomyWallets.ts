import type { AppUser } from "../../domain/entities/AppUser.js";
import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import type { ListCasinoPlayersUseCase } from "./ListCasinoPlayers.js";

export type CasinoEconomyRow = {
  /** AppUser del titular — puede ser `player` (roster) o `dealer` (asignado). */
  user: AppUser;
  walletId: string | null;
  balance: number;
  walletActive: boolean;
};

/**
 * Materializa la vista económica del casino: una fila por titular con wallet
 * potencial en el casino. Incluye:
 *   - Cada jugador del roster derivado (departamentos),
 *   - Cada dealer asignado al casino (casino.dealerIds).
 *
 * Si el titular aún no tiene wallet (nadie le ha acreditado, ningún cobro le
 * ha generado comisión), el balance es 0 y walletId es null.
 *
 * Ordenamiento: players primero (por orden del roster), dealers después.
 */
export class ListCasinoEconomyWalletsUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
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

    // Dealers asignados. Resolvemos por id — devolvemos solo los que existen
    // y están activos (los archivados no aparecen en la vista).
    const dealerLookups = await Promise.all(
      casino.dealerIds.map((id) => this.users.findById(id)),
    );
    const dealers = dealerLookups.filter(
      (u): u is AppUser => u !== null && u.active && u.role === "dealer",
    );

    const byUser = new Map<
      string,
      { id: string; balance: number; active: boolean }
    >();
    for (const w of wallets) {
      const prev = byUser.get(w.userId);
      // Si hay duplicados (race de doble-create), preferimos el más viejo
      // consistentemente con WalletRepo.findByCasinoAndUser.
      if (!prev) {
        byUser.set(w.userId, { id: w.id, balance: w.balance, active: w.active });
      }
    }

    const rowFor = (user: AppUser): CasinoEconomyRow => {
      const w = byUser.get(user.id);
      return {
        user,
        walletId: w?.id ?? null,
        balance: w?.balance ?? 0,
        walletActive: w?.active ?? true,
      };
    };

    return [...roster.map(rowFor), ...dealers.map(rowFor)];
  }
}
