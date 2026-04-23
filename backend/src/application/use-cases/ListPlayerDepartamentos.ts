import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";

/**
 * Returns the sorted, deduplicated list of department names currently in use
 * by active players. Used by the admin UI to build the "assign department"
 * multi-select on a casino detail page. An empty array simply means the
 * catalog has no players yet.
 */
export class ListPlayerDepartamentosUseCase {
  constructor(private readonly users: AppUserRepo) {}

  async execute(): Promise<string[]> {
    return this.users.listPlayerDepartamentos();
  }
}
