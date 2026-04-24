import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppUser } from "../../domain/entities/AppUser.js";

/**
 * Devuelve el roster de quienes pueden ocupar el slot de tallador en una
 * mesa: dealers + masters. Los masters también operan mesas en la práctica,
 * así que el admin los necesita visibles al curar el pool de dealers de un
 * casino y al asignar tallador a una mesa puntual.
 *
 * Incluye archivados (active=false) para que el UI pueda mostrar estado;
 * excluye borrados. La UI filtra por `active` antes de permitir asignar.
 */
export class ListDealerCandidatesUseCase {
  constructor(private readonly users: AppUserRepo) {}

  execute(): Promise<AppUser[]> {
    return this.users.listByRoles(["dealer", "master"]);
  }
}
