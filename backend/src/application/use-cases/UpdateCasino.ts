import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { Casino } from "../../domain/entities/Casino.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type UpdateCasinoInput = {
  casinoId: string;
  name?: string;
  date?: Date;
  departamentos?: string[];
  dealerIds?: string[];
};

export class UpdateCasinoUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
  ) {}

  async execute(input: UpdateCasinoInput): Promise<Casino> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();

    const patch: {
      name?: string;
      date?: Date;
      departamentos?: string[];
      dealerIds?: string[];
    } = {};

    if (input.name !== undefined) {
      const trimmed = input.name.trim();
      if (!trimmed) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "El nombre no puede quedar vacío",
        );
      }
      patch.name = trimmed;
    }

    if (input.date !== undefined) {
      if (Number.isNaN(input.date.getTime())) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "La fecha es inválida",
        );
      }
      patch.date = input.date;
    }

    if (input.departamentos !== undefined) {
      if (!Array.isArray(input.departamentos)) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "departamentos debe ser un arreglo",
        );
      }
      patch.departamentos = input.departamentos;
    }

    if (input.dealerIds !== undefined) {
      if (!Array.isArray(input.dealerIds)) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "dealerIds debe ser un arreglo",
        );
      }
      // Validate every id resolves to an active dealer — an archived or
      // soft-deleted user must not end up in the casino's dealer pool.
      for (const dealerId of input.dealerIds) {
        if (typeof dealerId !== "string" || !dealerId) {
          throw new AuthError(
            "INVALID_CREDENTIALS",
            400,
            "dealerIds contiene un id vacío",
          );
        }
        const user = await this.users.findById(dealerId);
        if (!user) {
          throw new AuthError(
            "INVALID_CREDENTIALS",
            404,
            `Dealer ${dealerId} no encontrado`,
          );
        }
        if (!user.active) {
          throw new AuthError(
            "INACTIVE_ACCOUNT",
            400,
            `El dealer ${user.matricula} está archivado`,
          );
        }
        if (user.role !== "dealer") {
          throw new AuthError(
            "INSUFFICIENT_ROLE",
            400,
            `${user.matricula} no es dealer`,
          );
        }
      }
      patch.dealerIds = input.dealerIds;
    }

    return this.casinos.update(input.casinoId, patch);
  }
}
