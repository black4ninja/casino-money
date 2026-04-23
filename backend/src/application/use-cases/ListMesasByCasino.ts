import type { MesaRepo } from "../../domain/ports/MesaRepo.js";
import type { Mesa } from "../../domain/entities/Mesa.js";

export class ListMesasByCasinoUseCase {
  constructor(private readonly mesas: MesaRepo) {}

  execute(casinoId: string): Promise<Mesa[]> {
    return this.mesas.listByCasino(casinoId);
  }
}
