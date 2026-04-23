import type { Request, Response, NextFunction } from "express";
import type { ListMyMesasUseCase } from "../../../application/use-cases/ListMyMesas.js";

export class MeController {
  constructor(private readonly listMyMesas: ListMyMesasUseCase) {}

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
}
