import type { Request, Response, NextFunction } from "express";
import type { GetCasinoAuctionUseCase } from "../../../application/use-cases/auction/GetCasinoAuction.js";
import type { SetAuctionInitialValueUseCase } from "../../../application/use-cases/auction/SetAuctionInitialValue.js";
import type { AdjustAuctionValueUseCase } from "../../../application/use-cases/auction/AdjustAuctionValue.js";
import type { RaiseAuctionPaddleUseCase } from "../../../application/use-cases/auction/RaiseAuctionPaddle.js";
import type { ResetAuctionUseCase } from "../../../application/use-cases/auction/ResetAuction.js";
import type { MarkAuctionSoldUseCase } from "../../../application/use-cases/auction/MarkAuctionSold.js";

function resolveCasinoId(req: Request): string | null {
  const id = req.params.casinoId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class AuctionController {
  constructor(
    private readonly getAuction: GetCasinoAuctionUseCase,
    private readonly setInitial: SetAuctionInitialValueUseCase,
    private readonly adjust: AdjustAuctionValueUseCase,
    private readonly raisePaddle: RaiseAuctionPaddleUseCase,
    private readonly reset: ResetAuctionUseCase,
    private readonly markSold: MarkAuctionSoldUseCase,
  ) {}

  /** GET público (sin auth) — sirve al display global en proyector. */
  showPublic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const auction = await this.getAuction.execute(casinoId);
      res.json({ auction: auction.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  /** GET autenticado — admin/player con credenciales. */
  show = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const auction = await this.getAuction.execute(casinoId);
      res.json({ auction: auction.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  postInitial = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const { initialValue } = req.body ?? {};
      if (typeof initialValue !== "number") {
        res
          .status(400)
          .json({ status: "error", message: "initialValue must be a number" });
        return;
      }
      const auction = await this.setInitial.execute({
        casinoId,
        initialValue,
      });
      res.json({ auction: auction.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  postAdjust = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const { op, factor } = req.body ?? {};
      if (op !== "add" && op !== "mul") {
        res
          .status(400)
          .json({ status: "error", message: "op must be 'add' or 'mul'" });
        return;
      }
      if (typeof factor !== "number") {
        res
          .status(400)
          .json({ status: "error", message: "factor must be a number" });
        return;
      }
      const auction = await this.adjust.execute({ casinoId, op, factor });
      res.json({ auction: auction.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  postRaisePaddle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        res.status(401).json({ status: "error", message: "not authenticated" });
        return;
      }
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const { amount } = req.body ?? {};
      if (typeof amount !== "number") {
        res
          .status(400)
          .json({ status: "error", message: "amount must be a number" });
        return;
      }
      const auction = await this.raisePaddle.execute({
        casinoId,
        playerId: userId,
        amount,
      });
      res.json({ auction: auction.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  postSold = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const actorId = req.user?.sub;
      if (!actorId) {
        res.status(401).json({ status: "error", message: "not authenticated" });
        return;
      }
      const auction = await this.markSold.execute({ casinoId, actorId });
      res.json({ auction: auction.toPublic() });
    } catch (err) {
      next(err);
    }
  };

  postReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const auction = await this.reset.execute(casinoId);
      res.json({ auction: auction.toPublic() });
    } catch (err) {
      next(err);
    }
  };
}
