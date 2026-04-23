import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type CreateCasinoInput = {
  name: string;
  date: Date;
};

export class CreateCasinoUseCase {
  constructor(private readonly casinos: CasinoRepo) {}

  async execute(input: CreateCasinoInput): Promise<Casino> {
    const name = input.name.trim();
    if (!name) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        400,
        "El nombre del casino es obligatorio",
      );
    }
    if (Number.isNaN(input.date.getTime())) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        400,
        "La fecha del casino es inválida",
      );
    }
    return this.casinos.create({ name, date: input.date });
  }
}
