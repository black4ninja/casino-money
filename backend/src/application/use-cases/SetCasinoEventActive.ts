import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import type { CasinoEvent } from "../../domain/entities/CasinoEvent.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type SetCasinoEventActiveInput = {
  eventId: string;
  active: boolean;
};

/**
 * Activa/archiva un evento. Para garantizar semántica clara al jugador
 * (si está activo un evento WIN_DOUBLE, lo está solo ese), al activar se
 * auto-archivan los otros eventos activos del MISMO type en el MISMO casino.
 * El multiplicador no se compone — sólo hay un evento por tipo en curso.
 */
export class SetCasinoEventActiveUseCase {
  constructor(private readonly events: CasinoEventRepo) {}

  async execute(input: SetCasinoEventActiveInput): Promise<CasinoEvent> {
    const target = await this.events.findById(input.eventId);
    if (!target) throw AuthError.validation("event not found");

    if (input.active && !target.active) {
      // Al activar, desactivar todos los activos del mismo type (single-active-per-type).
      const actives = await this.events.listActiveByCasino(target.casinoId);
      for (const other of actives) {
        if (other.id === target.id) continue;
        if (other.type !== target.type) continue;
        await this.events.setActive(other.id, false);
      }
    }

    return this.events.setActive(input.eventId, input.active);
  }
}
