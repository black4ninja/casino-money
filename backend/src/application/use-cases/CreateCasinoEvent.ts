import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import {
  CasinoEvent,
  isCasinoEventType,
  type CasinoEventType,
} from "../../domain/entities/CasinoEvent.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type CreateCasinoEventInput = {
  casinoId: string;
  name: string;
  type: string;
};

const MAX_NAME_LEN = 80;

function validateName(name: unknown): string | null {
  if (typeof name !== "string") return "name is required";
  const trimmed = name.trim();
  if (!trimmed) return "name is required";
  if (trimmed.length > MAX_NAME_LEN) {
    return `name must be at most ${MAX_NAME_LEN} chars`;
  }
  return null;
}

export class CreateCasinoEventUseCase {
  constructor(
    private readonly events: CasinoEventRepo,
    private readonly casinos: CasinoRepo,
  ) {}

  async execute(input: CreateCasinoEventInput): Promise<CasinoEvent> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.active) throw AuthError.casinoArchived();

    if (!isCasinoEventType(input.type)) {
      throw AuthError.validation(
        `Tipo de evento no soportado: ${String(input.type)}`,
      );
    }

    const nameErr = validateName(input.name);
    if (nameErr) throw AuthError.validation(nameErr);

    return this.events.create({
      casinoId: input.casinoId,
      name: input.name.trim(),
      type: input.type as CasinoEventType,
    });
  }
}
