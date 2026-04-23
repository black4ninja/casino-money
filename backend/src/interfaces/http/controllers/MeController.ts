import type { Request, Response, NextFunction } from "express";
import type { ListMyMesasUseCase } from "../../../application/use-cases/ListMyMesas.js";
import type { ListMyCasinosUseCase } from "../../../application/use-cases/ListMyCasinos.js";
import type { ListMyCasinoMesasUseCase } from "../../../application/use-cases/ListMyCasinoMesas.js";
import type { GetMyCasinoMesaLastSpinUseCase } from "../../../application/use-cases/GetMyCasinoMesaLastSpin.js";
import type { UpdateMyAliasUseCase } from "../../../application/use-cases/UpdateMyAlias.js";

export class MeController {
  constructor(
    private readonly listMyMesas: ListMyMesasUseCase,
    private readonly listMyCasinos: ListMyCasinosUseCase,
    private readonly listMyCasinoMesas: ListMyCasinoMesasUseCase,
    private readonly getMyCasinoMesaLastSpin: GetMyCasinoMesaLastSpinUseCase,
    private readonly updateMyAlias: UpdateMyAliasUseCase,
  ) {}

  myMesas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ status: "error", message: "not authenticated" });
        return;
      }
      const views = await this.listMyMesas.execute(userId);
      res.json({
        mesas: views.map(({ mesa, casino }) => ({
          ...mesa.toPublic(),
          casino: casino.toPublic(),
        })),
      });
    } catch (err) {
      next(err);
    }
  };

  myCasinos = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ status: "error", message: "not authenticated" });
        return;
      }
      const casinos = await this.listMyCasinos.execute(userId);
      res.json({ casinos: casinos.map((c) => c.toPublic()) });
    } catch (err) {
      next(err);
    }
  };

  myCasinoMesas = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ status: "error", message: "not authenticated" });
        return;
      }
      const casinoId = req.params.casinoId;
      if (typeof casinoId !== "string" || !casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const mesas = await this.listMyCasinoMesas.execute(userId, casinoId);
      res.json({ mesas: mesas.map((m) => m.toPublic()) });
    } catch (err) {
      next(err);
    }
  };

  myCasinoMesaLastSpin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ status: "error", message: "not authenticated" });
        return;
      }
      const { casinoId, mesaId } = req.params;
      if (typeof casinoId !== "string" || !casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      if (typeof mesaId !== "string" || !mesaId) {
        res.status(400).json({ status: "error", message: "mesaId required" });
        return;
      }
      const spin = await this.getMyCasinoMesaLastSpin.execute(
        userId,
        casinoId,
        mesaId,
      );
      res.json({ spin: spin ? spin.toPublic() : null });
    } catch (err) {
      next(err);
    }
  };

  patchAlias = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ status: "error", message: "not authenticated" });
        return;
      }
      const body = (req.body ?? {}) as { alias?: unknown };
      // Accept string or null; anything else is a client error.
      const alias =
        body.alias === null
          ? null
          : typeof body.alias === "string"
            ? body.alias
            : undefined;
      if (alias === undefined) {
        res
          .status(400)
          .json({ status: "error", message: "alias must be a string or null" });
        return;
      }
      const user = await this.updateMyAlias.execute({ userId, alias });
      res.json({ user: user.toPublic() });
    } catch (err) {
      next(err);
    }
  };
}
