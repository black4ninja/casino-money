import type { Request, Response, NextFunction } from "express";
import type { PlaySlotMachineSpinUseCase } from "../../../application/use-cases/PlaySlotMachineSpin.js";
import type { ListSlotMachineHistoryUseCase } from "../../../application/use-cases/ListSlotMachineHistory.js";
import type { GetMyCasinoWalletUseCase } from "../../../application/use-cases/GetMyCasinoWallet.js";

function resolveCasinoId(req: Request): string | null {
  const id = req.params.casinoId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class SlotMachineController {
  constructor(
    private readonly play: PlaySlotMachineSpinUseCase,
    private readonly list: ListSlotMachineHistoryUseCase,
    private readonly getWallet: GetMyCasinoWalletUseCase,
  ) {}

  spin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const { bet, batchId } = (req.body ?? {}) as {
        bet?: unknown;
        batchId?: unknown;
      };
      if (typeof bet !== "number") {
        res.status(400).json({ status: "error", message: "bet required (number)" });
        return;
      }
      if (typeof batchId !== "string") {
        res.status(400).json({ status: "error", message: "batchId required (string)" });
        return;
      }
      const result = await this.play.execute({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        casinoId,
        bet,
        batchId,
      });
      res.status(result.replayed ? 200 : 201).json({
        spin: result.spin.toPublic(),
        balanceAfter: result.balanceAfter,
        outcome: result.outcome,
        replayed: result.replayed,
      });
    } catch (err) {
      next(err);
    }
  };

  wallet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const result = await this.getWallet.execute({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        casinoId,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  history = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const rawLimit = req.query.limit;
      const limit =
        typeof rawLimit === "string" && rawLimit.length > 0
          ? Number(rawLimit)
          : undefined;
      const spins = await this.list.execute({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        casinoId,
        limit: Number.isFinite(limit) ? limit : undefined,
      });
      res.json({ spins: spins.map((s) => s.toPublic()) });
    } catch (err) {
      next(err);
    }
  };
}
