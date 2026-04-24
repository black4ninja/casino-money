import type { NextFunction, Request, Response } from "express";
import type { GetCurrentPatternRaceUseCase } from "../../../application/use-cases/patternRace/GetCurrentPatternRace.js";
import type { PlacePatternRaceBetUseCase } from "../../../application/use-cases/patternRace/PlacePatternRaceBet.js";
import type { ListMyPatternRaceBetsUseCase } from "../../../application/use-cases/patternRace/ListMyPatternRaceBets.js";
import { enrichBet } from "../../../application/use-cases/patternRace/enrichBet.js";

function resolveCasinoId(req: Request): string | null {
  const id = req.params.casinoId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class PatternRaceController {
  constructor(
    private readonly getCurrent: GetCurrentPatternRaceUseCase,
    private readonly placeBet: PlacePatternRaceBetUseCase,
    private readonly listMyBets: ListMyPatternRaceBetsUseCase,
  ) {}

  /** Público: cualquiera puede proyectar la vista. */
  current = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const snap = await this.getCurrent.execute({ casinoId });
      res.json(snap);
    } catch (err) {
      next(err);
    }
  };

  /** Auth player: coloca una apuesta en el ciclo actual. */
  bet = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casinoId required" });
        return;
      }
      const { patternId, betKind, amount, betBatchId } = (req.body ?? {}) as {
        patternId?: unknown;
        betKind?: unknown;
        amount?: unknown;
        betBatchId?: unknown;
      };
      if (typeof patternId !== "string") {
        res.status(400).json({ status: "error", message: "patternId required (string)" });
        return;
      }
      if (typeof betKind !== "string") {
        res.status(400).json({ status: "error", message: "betKind required (string)" });
        return;
      }
      if (typeof amount !== "number") {
        res.status(400).json({ status: "error", message: "amount required (number)" });
        return;
      }
      if (typeof betBatchId !== "string") {
        res.status(400).json({ status: "error", message: "betBatchId required (string)" });
        return;
      }
      const result = await this.placeBet.execute({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        casinoId,
        patternId,
        betKind,
        amount,
        betBatchId,
      });
      res.status(result.replayed ? 200 : 201).json({
        bet: enrichBet(result.bet),
        balanceAfter: result.balanceAfter,
        replayed: result.replayed,
      });
    } catch (err) {
      next(err);
    }
  };

  myBets = async (req: Request, res: Response, next: NextFunction) => {
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
      const { bets } = await this.listMyBets.execute({
        actorId: req.user!.sub,
        actorRole: req.user!.role,
        casinoId,
        limit: Number.isFinite(limit) ? limit : undefined,
      });
      res.json({ bets: bets.map((b) => enrichBet(b)) });
    } catch (err) {
      next(err);
    }
  };
}
