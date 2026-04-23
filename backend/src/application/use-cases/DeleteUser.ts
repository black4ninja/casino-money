import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppSessionRepo } from "../../domain/ports/AppSessionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type DeleteUserInput = {
  /** Master performing the action — cannot delete themselves. */
  actorId: string;
  userId: string;
};

/**
 * Logical delete: flips exists=false (also active=false) and revokes sessions.
 * The row stays in the DB for audit; every query path filters by exists=true
 * so from the app's perspective the user is gone.
 */
export class DeleteUserUseCase {
  constructor(
    private readonly users: AppUserRepo,
    private readonly sessions: AppSessionRepo,
  ) {}

  async execute(input: DeleteUserInput): Promise<void> {
    if (input.actorId === input.userId) {
      throw new AuthError(
        "INSUFFICIENT_ROLE",
        400,
        "No puedes eliminarte a ti mismo",
      );
    }
    const user = await this.users.findById(input.userId);
    if (!user) throw AuthError.tokenInvalid();

    await this.users.softDelete(input.userId);
    await this.sessions.revokeAllForUser(input.userId);
  }
}
