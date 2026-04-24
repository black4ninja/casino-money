import type { Request, Response, NextFunction } from "express";
import type { CreateCasinoEventUseCase } from "../../../application/use-cases/CreateCasinoEvent.js";
import type { ListCasinoEventsUseCase } from "../../../application/use-cases/ListCasinoEvents.js";
import type { UpdateCasinoEventUseCase } from "../../../application/use-cases/UpdateCasinoEvent.js";
import type { SetCasinoEventActiveUseCase } from "../../../application/use-cases/SetCasinoEventActive.js";
import type { DeleteCasinoEventUseCase } from "../../../application/use-cases/DeleteCasinoEvent.js";

function resolveCasinoId(req: Request): string | null {
  const id = req.params.casinoId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function resolveEventId(req: Request): string | null {
  const id = req.params.eventId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class CasinoEventController {
  constructor(
    private readonly createEvent: CreateCasinoEventUseCase,
    private readonly listEvents: ListCasinoEventsUseCase,
    private readonly updateEvent: UpdateCasinoEventUseCase,
    private readonly setActive: SetCasinoEventActiveUseCase,
    private readonly deleteEvent: DeleteCasinoEventUseCase,
  ) {}

  /** Admin — todos los eventos del casino (activos + archivados). */
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const events = await this.listEvents.execute(casinoId);
      res.json({ events: events.map((e) => e.toPublic()) });
    } catch (err) {
      next(err);
    }
  };

  /** Público autenticado — sólo eventos en curso. Consumido por el banner
   *  del jugador mediante polling. */
  listActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const events = await this.listEvents.executeActive(casinoId);
      res.json({ events: events.map((e) => e.toPublic()) });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const { name, type } = req.body ?? {};
      if (typeof name !== "string") {
        res.status(400).json({ status: "error", message: "name is required" });
        return;
      }
      if (typeof type !== "string") {
        res.status(400).json({ status: "error", message: "type is required" });
        return;
      }
      const event = await this.createEvent.execute({ casinoId, name, type });
      res.status(201).json({ event: event.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = resolveEventId(req);
      if (!eventId) {
        res.status(400).json({ status: "error", message: "eventId required" });
        return;
      }
      const { name } = req.body ?? {};
      const event = await this.updateEvent.execute({
        eventId,
        name: typeof name === "string" ? name : undefined,
      });
      res.json({ event: event.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = resolveEventId(req);
      if (!eventId) {
        res.status(400).json({ status: "error", message: "eventId required" });
        return;
      }
      const event = await this.setActive.execute({ eventId, active: true });
      res.json({ event: event.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = resolveEventId(req);
      if (!eventId) {
        res.status(400).json({ status: "error", message: "eventId required" });
        return;
      }
      const event = await this.setActive.execute({ eventId, active: false });
      res.json({ event: event.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const eventId = resolveEventId(req);
      if (!eventId) {
        res.status(400).json({ status: "error", message: "eventId required" });
        return;
      }
      await this.deleteEvent.execute({ eventId });
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  };
}
