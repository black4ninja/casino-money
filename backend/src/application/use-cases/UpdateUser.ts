import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import { hashPassword } from "../../infrastructure/crypto/passwordHasher.js";

export type UpdateUserInput = {
  userId: string;
  /** If provided, replaces the name (empty string → cleared). */
  fullName?: string | null;
  /** If provided (non-empty), rotates the password. Must be ≥8 chars. */
  password?: string;
};

export class UpdateUserUseCase {
  constructor(private readonly users: AppUserRepo) {}

  async execute(input: UpdateUserInput): Promise<AppUser> {
    const user = await this.users.findById(input.userId);
    if (!user) throw AuthError.tokenInvalid();

    const patch: { fullName?: string | null; passwordHash?: string } = {};
    if (input.fullName !== undefined) {
      patch.fullName = input.fullName;
    }
    if (input.password !== undefined && input.password.length > 0) {
      if (input.password.length < 8) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "Password must be at least 8 characters",
        );
      }
      patch.passwordHash = await hashPassword(input.password);
    }
    return this.users.update(input.userId, patch);
  }
}
