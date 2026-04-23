import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type SetCasinoActiveInput = {
  casinoId: string;
  active: boolean;
};

export class SetCasinoActiveUseCase {
  constructor(private readonly casinos: CasinoRepo) {}

  async execute(input: SetCasinoActiveInput): Promise<Casino> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    return this.casinos.setActive(input.casinoId, input.active);
  }
}
