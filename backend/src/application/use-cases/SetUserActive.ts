import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppSessionRepo } from "../../domain/ports/AppSessionRepo.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type SetUserActiveInput = {
  /** Master performing the action — cannot archive themselves. */
  actorId: string;
  userId: string;
  active: boolean;
};

/**
 * Archive (active=false) / unarchive (active=true).
 *
 * Archived users:
 *   - cannot log in (LoginUseCase rejects with INACTIVE_ACCOUNT)
 *   - any outstanding access token becomes useless on next refresh attempt
 *     because GetCurrentUser rejects them too
 *   - we additionally revoke all sessions to kill live refresh tokens
 */
export class SetUserActiveUseCase {
  constructor(
    private readonly users: AppUserRepo,
    private readonly sessions: AppSessionRepo,
  ) {}

  async execute(input: SetUserActiveInput): Promise<AppUser> {
    if (input.actorId === input.userId && input.active === false) {
      throw new AuthError(
        "INSUFFICIENT_ROLE",
        400,
        "No puedes archivarte a ti mismo",
      );
    }
    const user = await this.users.findById(input.userId);
    if (!user) throw AuthError.tokenInvalid();

    const updated = await this.users.setActive(input.userId, input.active);
    if (!input.active) {
      await this.sessions.revokeAllForUser(input.userId);
    }
    return updated;
  }
}
