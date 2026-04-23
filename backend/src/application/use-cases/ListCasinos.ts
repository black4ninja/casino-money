import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";

export class ListCasinosUseCase {
  constructor(private readonly casinos: CasinoRepo) {}

  execute(): Promise<Casino[]> {
    return this.casinos.list();
  }
}
