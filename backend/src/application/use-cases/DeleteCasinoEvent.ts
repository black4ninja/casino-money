import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type DeleteCasinoEventInput = {
  eventId: string;
};

export class DeleteCasinoEventUseCase {
  constructor(private readonly events: CasinoEventRepo) {}

  async execute(input: DeleteCasinoEventInput): Promise<void> {
    const existing = await this.events.findById(input.eventId);
    if (!existing) throw AuthError.validation("event not found");
    await this.events.softDelete(input.eventId);
  }
}
