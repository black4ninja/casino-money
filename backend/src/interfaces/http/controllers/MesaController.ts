import type { Request, Response, NextFunction } from "express";
import type { CreateMesaUseCase } from "../../../application/use-cases/CreateMesa.js";
import type { ListMesasByCasinoUseCase } from "../../../application/use-cases/ListMesasByCasino.js";
import type { UpdateMesaUseCase } from "../../../application/use-cases/UpdateMesa.js";
import type { SetMesaActiveUseCase } from "../../../application/use-cases/SetMesaActive.js";
import type { DeleteMesaUseCase } from "../../../application/use-cases/DeleteMesa.js";

function resolveCasinoId(req: Request): string | null {
  const id = req.params.casinoId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function resolveMesaId(req: Request): string | null {
  const id = req.params.mesaId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class MesaController {
  constructor(
    private readonly createMesa: CreateMesaUseCase,
    private readonly listMesas: ListMesasByCasinoUseCase,
    private readonly updateMesa: UpdateMesaUseCase,
    private readonly setMesaActive: SetMesaActiveUseCase,
    private readonly deleteMesa: DeleteMesaUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const mesas = await this.listMesas.execute(casinoId);
      res.json({ mesas: mesas.map((m) => m.toPublic()) });
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
      const { gameType } = req.body ?? {};
      if (typeof gameType !== "string") {
        res.status(400).json({ status: "error", message: "gameType is required" });
        return;
      }
      const mesa = await this.createMesa.execute({ casinoId, gameType });
      res.status(201).json({ mesa: mesa.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mesaId = resolveMesaId(req);
      if (!mesaId) {
        res.status(400).json({ status: "error", message: "mesaId required" });
        return;
      }
      const body = req.body ?? {};
      const { gameType, talladorId } = body;
      // talladorId: undefined → leave; null → unassign; string → assign.
      let talladorPatch: string | null | undefined;
      if (Object.prototype.hasOwnProperty.call(body, "talladorId")) {
        if (talladorId === null) {
          talladorPatch = null;
        } else if (typeof talladorId === "string" && talladorId.length > 0) {
          talladorPatch = talladorId;
        } else {
          res
            .status(400)
            .json({ status: "error", message: "talladorId inválido" });
          return;
        }
      }
      const mesa = await this.updateMesa.execute({
        mesaId,
        gameType: typeof gameType === "string" ? gameType : undefined,
        talladorId: talladorPatch,
      });
      res.json({ mesa: mesa.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mesaId = resolveMesaId(req);
      if (!mesaId) {
        res.status(400).json({ status: "error", message: "mesaId required" });
        return;
      }
      const mesa = await this.setMesaActive.execute({ mesaId, active: false });
      res.json({ mesa: mesa.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  unarchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mesaId = resolveMesaId(req);
      if (!mesaId) {
        res.status(400).json({ status: "error", message: "mesaId required" });
        return;
      }
      const mesa = await this.setMesaActive.execute({ mesaId, active: true });
      res.json({ mesa: mesa.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mesaId = resolveMesaId(req);
      if (!mesaId) {
        res.status(400).json({ status: "error", message: "mesaId required" });
        return;
      }
      await this.deleteMesa.execute({ mesaId });
      res.json({ status: "ok" });
    } catch (err) {
      next(err);
    }
  };
}
