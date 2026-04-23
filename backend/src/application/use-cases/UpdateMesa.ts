import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { Mesa } from "../../domain/entities/Mesa.js";
import type { GameType } from "../../domain/entities/GameType.js";
import { isGameType } from "../../domain/entities/GameType.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type UpdateMesaInput = {
  mesaId: string;
  gameType?: string;
  /**
   * undefined → leave assignment as-is
   * string    → assign this dealer
   * null      → clear the current assignment
   */
  talladorId?: string | null;
};

/**
 * Applies a partial update to a mesa. The tallador slot accepts only an
 * active dealer (role=dealer). Masters are not accepted here even though
 * the role hierarchy makes them capable of dealer actions — a mesa assignment
 * is a scheduling fact about a specific person with that job, not a permission.
 */
export class UpdateMesaUseCase {
  constructor(
    private readonly mesas: MesaRepo,
    private readonly users: AppUserRepo,
  ) {}

  async execute(input: UpdateMesaInput): Promise<Mesa> {
    const mesa = await this.mesas.findById(input.mesaId);
    if (!mesa) throw AuthError.tokenInvalid();

    const patch: { gameType?: GameType; talladorId?: string | null } = {};
    if (input.gameType !== undefined) {
      if (!isGameType(input.gameType)) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "Tipo de juego no reconocido",
        );
      }
      patch.gameType = input.gameType;
    }
    if (input.talladorId !== undefined) {
      if (input.talladorId === null) {
        patch.talladorId = null;
      } else {
        const user = await this.users.findById(input.talladorId);
        if (!user) {
          throw new AuthError(
            "INVALID_CREDENTIALS",
            404,
            "Tallador no encontrado",
          );
        }
        if (!user.active) {
          throw new AuthError(
            "INACTIVE_ACCOUNT",
            400,
            "Ese tallador está archivado",
          );
        }
        if (user.role !== "dealer") {
          throw new AuthError(
            "INSUFFICIENT_ROLE",
            400,
            "El usuario asignado debe ser tallador",
          );
        }
        patch.talladorId = user.id;
      }
    }
    return this.mesas.update(input.mesaId, patch);
  }
}
