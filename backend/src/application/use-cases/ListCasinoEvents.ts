import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import {
  type CasinoEvent,
  type CasinoEventType,
} from "../../domain/entities/CasinoEvent.js";

/**
 * Catálogo fijo que todo casino debe tener disponible. No se pueden
 * crear/eliminar eventos manualmente — estos siempre existen y el admin
 * sólo los activa/desactiva. Cada entry tiene un nombre default que se
 * muestra a los jugadores; el admin puede renombrarlo vía update.
 */
const DEFAULT_EVENTS: { type: CasinoEventType; name: string }[] = [
  { type: "WIN_DOUBLE", name: "Doble ganancia" },
  { type: "LOSS_DOUBLE", name: "Cobros dobles" },
  { type: "SLOT_DOUBLE", name: "Tragamonedas al doble" },
  { type: "CARRERA_DOUBLE", name: "Carrera al doble" },
  { type: "GREEDY_DOUBLE", name: "Greedy generoso" },
];

export class ListCasinoEventsUseCase {
  constructor(private readonly events: CasinoEventRepo) {}

  /**
   * Todos los eventos (activos + archivados) del casino. Panel admin.
   *
   * Auto-siembra los eventos default que falten — así cualquier casino,
   * incluso los creados antes de que existiera el feature, muestra los 2
   * toggles en vivo al entrar a su panel. Los crea como inactivos para que
   * el admin tenga que activarlos explícitamente.
   */
  async execute(casinoId: string): Promise<CasinoEvent[]> {
    const existing = await this.events.listByCasino(casinoId);
    const missing = DEFAULT_EVENTS.filter(
      (d) => !existing.some((e) => e.type === d.type),
    );
    if (missing.length === 0) return existing;
    for (const def of missing) {
      await this.events.create({
        casinoId,
        name: def.name,
        type: def.type,
      });
    }
    return this.events.listByCasino(casinoId);
  }

  /** Solo eventos en curso. Consumido por el banner del jugador y por
   *  la capa de transacciones para aplicar multiplicadores. No siembra —
   *  si nunca se abrió el panel admin, simplemente no hay eventos activos. */
  async executeActive(casinoId: string): Promise<CasinoEvent[]> {
    return this.events.listActiveByCasino(casinoId);
  }
}
