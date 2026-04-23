import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { RouletteSpinRepo } from "../../domain/ports/RouletteSpinRepo.js";
import type { RouletteSpin } from "../../domain/entities/RouletteSpin.js";

/**
 * Player-scoped read of the last roulette spin at a mesa. Unlike the
 * dealer-facing GetLastRouletteSpinUseCase (which enforces
 * master|assigned-dealer), this one lets a player read the spin so long
 * as they actually belong in the parent casino by departamento. On any
 * "not allowed" outcome (bad role, casino archived, mesa not in the
 * casino, etc.) we return null — the UI renders the empty state and
 * never learns whether the data exists.
 */
export class GetMyCasinoMesaLastSpinUseCase {
  constructor(
    private readonly spins: RouletteSpinRepo,
    private readonly mesas: MesaRepo,
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
  ) {}

  async execute(
    userId: string,
    casinoId: string,
    mesaId: string,
  ): Promise<RouletteSpin | null> {
    const user = await this.users.findById(userId);
    if (!user || !user.active || user.role !== "player") return null;
    const dept = (user.departamento ?? "").trim();
    if (!dept) return null;

    const casino = await this.casinos.findById(casinoId);
    if (!casino || !casino.active || !casino.exists) return null;
    if (!casino.departamentos.includes(dept)) return null;

    const mesa = await this.mesas.findById(mesaId);
    if (!mesa || !mesa.active || !mesa.exists) return null;
    if (mesa.casinoId !== casinoId) return null;

    return this.spins.findLastByMesa(mesaId);
  }
}
