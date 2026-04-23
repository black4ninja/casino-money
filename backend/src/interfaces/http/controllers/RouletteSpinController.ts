import type { Request, Response, NextFunction } from "express";
import type { RecordRouletteSpinUseCase } from "../../../application/use-cases/RecordRouletteSpin.js";
import type { GetLastRouletteSpinUseCase } from "../../../application/use-cases/GetLastRouletteSpin.js";

function resolveMesaId(req: Request): string | null {
  const id = req.params.mesaId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class RouletteSpinController {
  constructor(
    private readonly record: RecordRouletteSpinUseCase,
    private readonly getLast: GetLastRouletteSpinUseCase,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mesaId = resolveMesaId(req);
      if (!mesaId) {
        res.status(400).json({ status: "error", message: "mesaId required" });
        return;
      }
      const { patternId } = req.body ?? {};
      if (typeof patternId !== "string") {
        res.status(400).json({ status: "error", message: "patternId required" });
        return;
      }
      const spin = await this.record.execute({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        mesaId,
        patternId,
      });
      res.status(201).json({ spin: spin.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  last = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mesaId = resolveMesaId(req);
      if (!mesaId) {
        res.status(400).json({ status: "error", message: "mesaId required" });
        return;
      }
      const spin = await this.getLast.execute({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        mesaId,
      });
      res.json({ spin: spin ? spin.toPublic() : null });
    } catch (err) {
      next(err);
    }
  };
}
