import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { Role } from "../../domain/entities/Role.js";
import type { AppUser } from "../../domain/entities/AppUser.js";

export class ListUsersUseCase {
  constructor(private readonly users: AppUserRepo) {}

  execute(role: Role): Promise<AppUser[]> {
    return this.users.listByRole(role);
  }
}
