import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type DeleteMesaInput = {
  mesaId: string;
};

export class DeleteMesaUseCase {
  constructor(private readonly mesas: MesaRepo) {}

  async execute(input: DeleteMesaInput): Promise<void> {
    const mesa = await this.mesas.findById(input.mesaId);
    if (!mesa) throw AuthError.tokenInvalid();
    await this.mesas.softDelete(input.mesaId);
  }
}
