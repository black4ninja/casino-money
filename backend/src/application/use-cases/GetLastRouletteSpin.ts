import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { RouletteSpinRepo } from "../../domain/ports/RouletteSpinRepo.js";
import type { RouletteSpin } from "../../domain/entities/RouletteSpin.js";
import type { Role } from "../../domain/entities/Role.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type GetLastRouletteSpinInput = {
  actorId: string;
  actorRole: Role;
  mesaId: string;
};

/**
 * Read-only view of the mesa's most recent spin. Same authorization as
 * recording: only the assigned tallador or a master can read. Returns null
 * if the mesa has no spins yet — that's a normal "empty" state, not an error.
 */
export class GetLastRouletteSpinUseCase {
  constructor(
    private readonly spins: RouletteSpinRepo,
    private readonly mesas: MesaRepo,
  ) {}

  async execute(input: GetLastRouletteSpinInput): Promise<RouletteSpin | null> {
    const mesa = await this.mesas.findById(input.mesaId);
    if (!mesa) {
      throw new AuthError("INVALID_CREDENTIALS", 404, "Mesa no encontrada");
    }
    const isMaster = input.actorRole === "master";
    const isAssignedTallador = mesa.talladorId === input.actorId;
    if (!isMaster && !isAssignedTallador) {
      throw AuthError.insufficientRole();
    }
    return this.spins.findLastByMesa(input.mesaId);
  }
}
