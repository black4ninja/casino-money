import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type DeleteCasinoInput = {
  casinoId: string;
};

export class DeleteCasinoUseCase {
  constructor(private readonly casinos: CasinoRepo) {}

  async execute(input: DeleteCasinoInput): Promise<void> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    await this.casinos.softDelete(input.casinoId);
  }
}
