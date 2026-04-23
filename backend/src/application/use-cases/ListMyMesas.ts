import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Mesa } from "../../domain/entities/Mesa.js";
import type { Casino } from "../../domain/entities/Casino.js";

export type MyMesaView = {
  mesa: Mesa;
  casino: Casino;
};

/**
 * Returns the mesas assigned to the caller (as tallador), each paired with
 * its parent casino so a dealer-side UI can render everything in one request.
 *
 * Filtering rules:
 *   - Excludes soft-deleted mesas (repo already filters exists=false).
 *   - Excludes mesas whose parent casino is soft-deleted (casinos.findById
 *     returns null for those → we drop them).
 *   - Keeps archived mesas and archived casinos so the dealer sees the state
 *     and can decide whether to act on them.
 */
export class ListMyMesasUseCase {
  constructor(
    private readonly mesas: MesaRepo,
    private readonly casinos: CasinoRepo,
  ) {}

  async execute(userId: string): Promise<MyMesaView[]> {
    const mine = await this.mesas.listByTallador(userId);
    if (mine.length === 0) return [];

    const uniqueCasinoIds = Array.from(new Set(mine.map((m) => m.casinoId)));
    const resolved = await Promise.all(
      uniqueCasinoIds.map(async (id) => [id, await this.casinos.findById(id)] as const),
    );
    const byId = new Map<string, Casino>();
    for (const [id, casino] of resolved) {
      if (casino) byId.set(id, casino);
    }

    const views: MyMesaView[] = [];
    for (const mesa of mine) {
      const casino = byId.get(mesa.casinoId);
      if (casino) views.push({ mesa, casino });
    }
    return views;
  }
}
