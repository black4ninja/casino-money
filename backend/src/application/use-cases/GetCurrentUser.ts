import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export class GetCurrentUserUseCase {
  constructor(private readonly users: AppUserRepo) {}

  async execute(userId: string): Promise<AppUser> {
    const user = await this.users.findById(userId);
    if (!user) throw AuthError.tokenInvalid();
    if (!user.active) throw AuthError.inactiveAccount();
    return user;
  }
}
