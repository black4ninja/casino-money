import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";

/**
 * Returns the casinos the current user is eligible to play in. Membership
 * is role-dependent:
 *   - Players: dynamic membership por departamento (el player ve los
 *     casinos activos cuya lista de `departamentos` incluye el suyo).
 *   - Dealers: los casinos donde tienen al menos una mesa asignada
 *     (mismo recorrido que ListMyMesas, pero deduplicado por casino).
 *     El dealer necesita ver estos casinos para poder entrar al juego
 *     personal (tragamonedas/carrera) con su saldo de comisiones, igual
 *     que ya participa en la subasta.
 *
 * Filtering rules:
 *   - Caller must be active (archived users don't see casinos).
 *   - Masters don't play — devuelven lista vacía.
 *   - Casinos must be active (non-archived) AND exists=true.
 *   - Result is ordered by `date` ascending so the next event is on top.
 */
export class ListMyCasinosUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly mesas: MesaRepo,
  ) {}

  async execute(userId: string): Promise<Casino[]> {
    const user = await this.users.findById(userId);
    if (!user || !user.active) return [];

    if (user.role === "player") {
      const dept = (user.departamento ?? "").trim();
      if (!dept) return [];
      const all = await this.casinos.list();
      return all.filter(
        (c) => c.active && c.exists && c.departamentos.includes(dept),
      );
    }

    if (user.role === "dealer") {
      const myMesas = await this.mesas.listByTallador(userId);
      if (myMesas.length === 0) return [];
      const uniqueCasinoIds = Array.from(
        new Set(myMesas.map((m) => m.casinoId)),
      );
      const resolved = await Promise.all(
        uniqueCasinoIds.map((id) => this.casinos.findById(id)),
      );
      return resolved
        .filter((c): c is Casino => !!c && c.active && c.exists)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    return [];
  }
}
