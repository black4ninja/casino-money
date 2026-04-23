import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { Mesa } from "../../domain/entities/Mesa.js";

/**
 * Lists the mesas of a casino FROM THE PLAYER'S PERSPECTIVE — i.e. only
 * if the caller is an active player whose `departamento` is in the casino's
 * `departamentos` list. Any other case (staff, wrong department, archived
 * casino) returns an empty list so the client doesn't have to distinguish
 * "no mesas" from "no access". PlayerHome already runs its own access check
 * via /me/casinos; this is defence-in-depth for the data endpoint.
 *
 * Mesas are filtered to active (`active && exists`) so a player never sees
 * a table that was archived mid-event.
 */
export class ListMyCasinoMesasUseCase {
  constructor(
    private readonly mesas: MesaRepo,
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
  ) {}

  async execute(userId: string, casinoId: string): Promise<Mesa[]> {
    const user = await this.users.findById(userId);
    if (!user || !user.active) return [];
    if (user.role !== "player") return [];
    const dept = (user.departamento ?? "").trim();
    if (!dept) return [];

    const casino = await this.casinos.findById(casinoId);
    if (!casino || !casino.active || !casino.exists) return [];
    if (!casino.departamentos.includes(dept)) return [];

    const all = await this.mesas.listByCasino(casinoId);
    return all.filter((m) => m.active && m.exists);
  }
}
