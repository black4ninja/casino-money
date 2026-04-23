import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";

/**
 * Returns the casinos the current user is eligible to play in. Membership
 * is dynamic: a casino has the caller if the caller is an active player whose
 * `departamento` is in `casino.departamentos`.
 *
 * Filtering rules:
 *   - Caller must be active (archived players don't see casinos).
 *   - Only players see results. Staff (master/dealer) get an empty list from
 *     this endpoint — they manage casinos, they don't play in them.
 *   - Casinos must be active (non-archived) AND exists=true (repo's list()
 *     already excludes soft-deleted; we further drop archived since a player
 *     shouldn't see nights that were cancelled).
 *   - Result is ordered by `date` ascending so the next event is on top,
 *     matching the admin listing ordering.
 */
export class ListMyCasinosUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
  ) {}

  async execute(userId: string): Promise<Casino[]> {
    const user = await this.users.findById(userId);
    if (!user || !user.active) return [];
    if (user.role !== "player") return [];
    const dept = (user.departamento ?? "").trim();
    if (!dept) return [];

    const all = await this.casinos.list();
    return all.filter(
      (c) => c.active && c.exists && c.departamentos.includes(dept),
    );
  }
}
