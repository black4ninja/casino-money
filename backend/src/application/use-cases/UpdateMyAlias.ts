import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type UpdateMyAliasInput = {
  userId: string;
  /** null or empty string clears the alias back to "use fullName/matricula". */
  alias: string | null;
};

const MAX_ALIAS_LENGTH = 24;
const MIN_ALIAS_LENGTH = 2;

/**
 * Self-service alias update — the player sets their own display name while
 * playing. `fullName` is the school-of-record identity and is not touched
 * here; `alias` lives in its own column. Staff roles are rejected: their
 * display name is `fullName`, and they shouldn't be carrying a playful
 * alias in the catalog.
 */
export class UpdateMyAliasUseCase {
  constructor(private readonly users: AppUserRepo) {}

  async execute(input: UpdateMyAliasInput): Promise<AppUser> {
    const user = await this.users.findById(input.userId);
    if (!user) throw AuthError.tokenInvalid();
    if (!user.active) throw AuthError.inactiveAccount();
    if (user.role !== "player") {
      throw new AuthError(
        "INSUFFICIENT_ROLE",
        403,
        "Solo los jugadores pueden tener alias",
      );
    }

    const raw = input.alias == null ? "" : input.alias.trim();
    if (raw.length === 0) {
      return this.users.update(input.userId, { alias: null });
    }
    if (raw.length < MIN_ALIAS_LENGTH) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        400,
        `El alias debe tener al menos ${MIN_ALIAS_LENGTH} caracteres`,
      );
    }
    if (raw.length > MAX_ALIAS_LENGTH) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        400,
        `El alias no puede exceder ${MAX_ALIAS_LENGTH} caracteres`,
      );
    }

    return this.users.update(input.userId, { alias: raw });
  }
}
