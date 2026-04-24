import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import type { CasinoEvent } from "../../domain/entities/CasinoEvent.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type UpdateCasinoEventInput = {
  eventId: string;
  name?: string;
};

const MAX_NAME_LEN = 80;

export class UpdateCasinoEventUseCase {
  constructor(private readonly events: CasinoEventRepo) {}

  async execute(input: UpdateCasinoEventInput): Promise<CasinoEvent> {
    const existing = await this.events.findById(input.eventId);
    if (!existing) throw AuthError.validation("event not found");

    const patch: { name?: string } = {};
    if (input.name !== undefined) {
      if (typeof input.name !== "string") {
        throw AuthError.validation("name must be a string");
      }
      const trimmed = input.name.trim();
      if (!trimmed) throw AuthError.validation("name is required");
      if (trimmed.length > MAX_NAME_LEN) {
        throw AuthError.validation(
          `name must be at most ${MAX_NAME_LEN} chars`,
        );
      }
      patch.name = trimmed;
    }

    if (Object.keys(patch).length === 0) return existing;

    return this.events.update(input.eventId, patch);
  }
}
