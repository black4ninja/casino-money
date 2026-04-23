import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { Mesa } from "../../domain/entities/Mesa.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type SetMesaActiveInput = {
  mesaId: string;
  active: boolean;
};

export class SetMesaActiveUseCase {
  constructor(private readonly mesas: MesaRepo) {}

  async execute(input: SetMesaActiveInput): Promise<Mesa> {
    const mesa = await this.mesas.findById(input.mesaId);
    if (!mesa) throw AuthError.tokenInvalid();
    return this.mesas.setActive(input.mesaId, input.active);
  }
}
