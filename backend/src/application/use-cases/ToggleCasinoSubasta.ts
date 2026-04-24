import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type ToggleCasinoSubastaInput = {
  casinoId: string;
  subastaActive: boolean;
};

/**
 * Entra/sale del modo subasta del casino. Mientras subastaActive=true, todas
 * las operaciones de dinero quedan suspendidas (los use cases de crédito/
 * débito/transferencia/tragamonedas/carrera lanzan `CASINO_IN_SUBASTA`) y
 * se habilita el flujo paralelo de paletas que no toca wallets.
 *
 * No se permite entrar a subasta si el casino está archivado — primero
 * reactivarlo; la subasta asume un casino abierto con público activo.
 */
export class ToggleCasinoSubastaUseCase {
  constructor(private readonly casinos: CasinoRepo) {}

  async execute(input: ToggleCasinoSubastaInput): Promise<Casino> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    if (!casino.active && input.subastaActive) {
      throw AuthError.validation(
        "No se puede iniciar subasta en un casino archivado.",
      );
    }
    if (casino.subastaActive === input.subastaActive) return casino;
    return this.casinos.setSubastaActive(input.casinoId, input.subastaActive);
  }
}
