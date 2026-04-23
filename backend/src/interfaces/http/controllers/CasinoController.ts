import type { Request, Response, NextFunction } from "express";
import type { CreateCasinoUseCase } from "../../../application/use-cases/CreateCasino.js";
import type { ListCasinosUseCase } from "../../../application/use-cases/ListCasinos.js";
import type { UpdateCasinoUseCase } from "../../../application/use-cases/UpdateCasino.js";
import type { SetCasinoActiveUseCase } from "../../../application/use-cases/SetCasinoActive.js";
import type { DeleteCasinoUseCase } from "../../../application/use-cases/DeleteCasino.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";

function resolveId(req: Request): string | null {
  const id = req.params.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function parseDate(raw: unknown): Date | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Accept full ISO ("2026-05-15T00:00:00.000Z") or date-only ("2026-05-15").
  // For date-only we force UTC midnight so it doesn't shift based on the
  // server's local TZ when roundtripping.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const parsed = dateOnly ? new Date(`${trimmed}T00:00:00.000Z`) : new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export class CasinoController {
  constructor(
    private readonly createCasino: CreateCasinoUseCase,
    private readonly listCasinos: ListCasinosUseCase,
    private readonly updateCasino: UpdateCasinoUseCase,
    private readonly setCasinoActive: SetCasinoActiveUseCase,
    private readonly deleteCasino: DeleteCasinoUseCase,
    private readonly casinos: CasinoRepo,
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const casinos = await this.listCasinos.execute();
      res.json({ casinos: casinos.map((c) => c.toPublic()) });
    } catch (err) {
      next(err);
    }
  };

  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = resolveId(req);
      if (!id) {
        res.status(400).json({ status: "error", message: "id required" });
        return;
      }
      const casino = await this.casinos.findById(id);
      if (!casino) {
        res.status(404).json({ status: "error", message: "Casino not found" });
        return;
      }
      res.json({ casino: casino.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, date } = req.body ?? {};
      if (typeof name !== "string") {
        res.status(400).json({ status: "error", message: "name is required" });
        return;
      }
      const parsed = parseDate(date);
      if (!parsed) {
        res.status(400).json({ status: "error", message: "date is required (YYYY-MM-DD)" });
        return;
      }
      const casino = await this.createCasino.execute({ name, date: parsed });
      res.status(201).json({ casino: casino.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = resolveId(req);
      if (!id) {
        res.status(400).json({ status: "error", message: "id required" });
        return;
      }
      const { name, date } = req.body ?? {};
      const parsedDate = date === undefined ? undefined : parseDate(date);
      if (date !== undefined && !parsedDate) {
        res.status(400).json({ status: "error", message: "invalid date" });
        return;
      }
      const casino = await this.updateCasino.execute({
        casinoId: id,
        name: typeof name === "string" ? name : undefined,
        date: parsedDate ?? undefined,
      });
      res.json({ casino: casino.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = resolveId(req);
      if (!id) {
        res.status(400).json({ status: "error", message: "id required" });
        return;
      }
      const casino = await this.setCasinoActive.execute({
        casinoId: id,
        active: false,
      });
      res.json({ casino: casino.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  unarchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = resolveId(req);
      if (!id) {
        res.status(400).json({ status: "error", message: "id required" });
        return;
      }
      const casino = await this.setCasinoActive.execute({
        casinoId: id,
        active: true,
      });
      res.json({ casino: casino.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = resolveId(req);
      if (!id) {
        res.status(400).json({ status: "error", message: "id required" });
        return;
      }
      await this.deleteCasino.execute({ casinoId: id });
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  };
}
