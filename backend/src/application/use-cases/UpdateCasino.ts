import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type UpdateCasinoInput = {
  casinoId: string;
  name?: string;
  date?: Date;
};

export class UpdateCasinoUseCase {
  constructor(private readonly casinos: CasinoRepo) {}

  async execute(input: UpdateCasinoInput): Promise<Casino> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();

    const patch: { name?: string; date?: Date } = {};
    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "El nombre no puede quedar vacío",
        );
      }
      patch.name = trimmed;
    }
    if (input.date !== undefined) {
      if (Number.isNaN(input.date.getTime())) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "La fecha es inválida",
        );
      }
      patch.date = input.date;
    }
    return this.casinos.update(input.casinoId, patch);
  }
}
