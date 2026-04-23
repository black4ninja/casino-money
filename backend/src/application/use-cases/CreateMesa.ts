import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Mesa } from "../../domain/entities/Mesa.js";
import type { GameType } from "../../domain/entities/GameType.js";
import { isGameType } from "../../domain/entities/GameType.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type CreateMesaInput = {
  casinoId: string;
  gameType: string;
};

export class CreateMesaUseCase {
  constructor(
    private readonly mesas: MesaRepo,
    private readonly casinos: CasinoRepo,
  ) {}

  async execute(input: CreateMesaInput): Promise<Mesa> {
    if (!isGameType(input.gameType)) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        400,
        "Tipo de juego no reconocido",
      );
    }
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        404,
        "Casino no encontrado",
      );
    }
    if (!casino.active) {
      throw new AuthError(
        "INACTIVE_ACCOUNT",
        400,
        "No se pueden agregar mesas a un casino archivado",
      );
    }
    return this.mesas.create({
      casinoId: input.casinoId,
      gameType: input.gameType as GameType,
    });
  }
}
