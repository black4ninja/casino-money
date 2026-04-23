import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { SlotMachineSpinRepo } from "../../domain/ports/SlotMachineSpinRepo.js";
import type { SlotMachineSpin } from "../../domain/entities/SlotMachineSpin.js";
import type { Role } from "../../domain/entities/Role.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type ListSlotMachineHistoryInput = {
  actorId: string;
  actorRole: Role;
  casinoId: string;
  limit?: number;
};

/**
 * Historial propio de la tragamonedas en un casino. Solo el jugador puede ver
 * su propia historia (no hay endpoint de "historia de otro jugador" — el
 * master puede usar el ledger de WalletTransaction en /economy/transactions
 * para auditar si necesita).
 */
export class ListSlotMachineHistoryUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly spins: SlotMachineSpinRepo,
  ) {}

  async execute(input: ListSlotMachineHistoryInput): Promise<SlotMachineSpin[]> {
    if (!input.actorId) throw AuthError.tokenInvalid();
    if (input.actorRole !== "player") {
      throw AuthError.validation(
        `El historial de tragamonedas es solo para jugadores (rol actual: ${input.actorRole}).`,
      );
    }

    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");

    const limit =
      typeof input.limit === "number" && input.limit > 0 && input.limit <= 200
        ? Math.floor(input.limit)
        : 50;

    return this.spins.listByCasinoAndPlayer(
      input.casinoId,
      input.actorId,
      limit,
    );
  }
}
