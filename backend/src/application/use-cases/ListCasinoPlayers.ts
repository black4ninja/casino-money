import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";

/**
 * Materializes the player roster of a casino from its `departamentos` list.
 * Membership is dynamic: if a player moves between departamentos they move
 * between casinos automatically. An empty `departamentos` array means the
 * casino has nobody playing yet.
 */
export class ListCasinoPlayersUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
  ) {}

  async execute(casinoId: string): Promise<AppUser[]> {
    const casino = await this.casinos.findById(casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    if (casino.departamentos.length === 0) return [];
    return this.users.listActivePlayersByDepartamentos(casino.departamentos);
  }
}
