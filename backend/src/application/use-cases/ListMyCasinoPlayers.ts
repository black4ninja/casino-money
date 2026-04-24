import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import type { ListCasinoPlayersUseCase } from "./ListCasinoPlayers.js";

export type ListMyCasinoPlayersInput = {
  actorId: string;
  casinoId: string;
};

/**
 * Devuelve el roster de jugadores del casino desde el punto de vista del
 * propio jugador autenticado. Sirve como fuente para el buscador de
 * destinatarios del flujo "transferir a otro jugador".
 *
 * Autorización: el caller debe ser un jugador activo cuyo `departamento`
 * pertenece al roster del casino — solo los participantes pueden ver a sus
 * compañeros. Master/dealer usan el endpoint económico `/wallets` para
 * ver saldos; esta lista intencionalmente NO expone balances (privacidad
 * entre pares).
 *
 * El propio caller se excluye del listado para evitar transferirse a sí
 * mismo, error común en UIs tipo "selector de jugador".
 */
export class ListMyCasinoPlayersUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly listCasinoPlayers: ListCasinoPlayersUseCase,
  ) {}

  async execute(input: ListMyCasinoPlayersInput): Promise<AppUser[]> {
    if (!input.actorId) throw AuthError.tokenInvalid();

    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");

    const actor = await this.users.findById(input.actorId);
    if (!actor) throw AuthError.tokenInvalid();
    if (actor.role !== "player") {
      throw AuthError.validation(
        "Solo los jugadores pueden consultar el roster de sus pares.",
      );
    }
    if (!actor.active) throw AuthError.inactiveAccount();
    if (
      actor.departamento === null ||
      !casino.departamentos.includes(actor.departamento)
    ) {
      throw AuthError.validation(
        "No estás registrado en el roster de este casino.",
      );
    }

    const roster = await this.listCasinoPlayers.execute(input.casinoId);
    return roster.filter((p) => p.id !== input.actorId);
  }
}
