import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { RouletteSpinRepo } from "../../domain/ports/RouletteSpinRepo.js";
import type { RouletteSpin } from "../../domain/entities/RouletteSpin.js";
import type { Role } from "../../domain/entities/Role.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type RecordRouletteSpinInput = {
  actorId: string;
  actorRole: Role;
  mesaId: string;
  patternId: string;
};

/**
 * Persists one spin result. Only the mesa's assigned tallador or a master
 * can record. The mesa must be a ruleta (can't log spin data for other
 * games) and must be active (archived mesas shouldn't be accumulating
 * new results).
 */
export class RecordRouletteSpinUseCase {
  constructor(
    private readonly spins: RouletteSpinRepo,
    private readonly mesas: MesaRepo,
  ) {}

  async execute(input: RecordRouletteSpinInput): Promise<RouletteSpin> {
    const mesa = await this.mesas.findById(input.mesaId);
    if (!mesa) {
      throw new AuthError("INVALID_CREDENTIALS", 404, "Mesa no encontrada");
    }
    if (mesa.gameType !== "ruleta") {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        400,
        "Sólo se pueden registrar giros en mesas de ruleta",
      );
    }
    if (!mesa.active) {
      throw new AuthError(
        "INACTIVE_ACCOUNT",
        400,
        "No se pueden registrar giros en una mesa archivada",
      );
    }
    const isMaster = input.actorRole === "master";
    const isAssignedTallador = mesa.talladorId === input.actorId;
    if (!isMaster && !isAssignedTallador) {
      throw AuthError.insufficientRole();
    }
    const patternId = input.patternId.trim();
    if (!patternId) {
      throw new AuthError("INVALID_CREDENTIALS", 400, "patternId requerido");
    }
    return this.spins.create({
      mesaId: input.mesaId,
      talladorId: input.actorId,
      patternId,
    });
  }
}
