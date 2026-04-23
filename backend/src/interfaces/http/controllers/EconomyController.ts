import type { Request, Response, NextFunction } from "express";
import type { BulkCreditCasinoPlayersUseCase } from "../../../application/use-cases/BulkCreditCasinoPlayers.js";
import type { CreditPlayerInCasinoUseCase } from "../../../application/use-cases/CreditPlayerInCasino.js";
import type { ListCasinoEconomyWalletsUseCase } from "../../../application/use-cases/ListCasinoEconomyWallets.js";
import type { ListPlayerCasinoTransactionsUseCase } from "../../../application/use-cases/ListPlayerCasinoTransactions.js";

function resolveCasinoId(req: Request): string | null {
  // Montado bajo /api/v1/casinos/:casinoId/economy — Express preserva el
  // :casinoId del mount parent cuando el router usa { mergeParams: true }.
  const id = req.params.casinoId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function resolvePlayerId(req: Request): string | null {
  const id = req.params.playerId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export class EconomyController {
  constructor(
    private readonly bulkCreditCasinoPlayers: BulkCreditCasinoPlayersUseCase,
    private readonly creditPlayerInCasino: CreditPlayerInCasinoUseCase,
    private readonly listCasinoEconomyWallets: ListCasinoEconomyWalletsUseCase,
    private readonly listPlayerCasinoTransactions: ListPlayerCasinoTransactionsUseCase,
  ) {}

  bulkCredit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casino id required" });
        return;
      }

      const { amount, batchId, note } = req.body ?? {};
      if (typeof amount !== "number") {
        res
          .status(400)
          .json({ status: "error", message: "amount must be a number" });
        return;
      }
      if (typeof batchId !== "string" || batchId.trim().length === 0) {
        res
          .status(400)
          .json({ status: "error", message: "batchId is required" });
        return;
      }
      const noteValue =
        typeof note === "string" && note.trim().length > 0
          ? note.trim().slice(0, 500)
          : null;

      const actorId = req.user?.sub;
      if (!actorId) {
        res.status(401).json({ status: "error", message: "unauthorized" });
        return;
      }

      const result = await this.bulkCreditCasinoPlayers.execute({
        casinoId,
        amount,
        batchId,
        actorId,
        note: noteValue,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  creditPlayer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      const playerId = resolvePlayerId(req);
      if (!casinoId || !playerId) {
        res
          .status(400)
          .json({ status: "error", message: "casino id and player id required" });
        return;
      }

      const { amount, batchId, note } = req.body ?? {};
      if (typeof amount !== "number") {
        res
          .status(400)
          .json({ status: "error", message: "amount must be a number" });
        return;
      }
      if (typeof batchId !== "string" || batchId.trim().length === 0) {
        res
          .status(400)
          .json({ status: "error", message: "batchId is required" });
        return;
      }
      const noteValue =
        typeof note === "string" && note.trim().length > 0
          ? note.trim().slice(0, 500)
          : null;

      const actorId = req.user?.sub;
      if (!actorId) {
        res.status(401).json({ status: "error", message: "unauthorized" });
        return;
      }

      const result = await this.creditPlayerInCasino.execute({
        casinoId,
        playerId,
        amount,
        batchId,
        actorId,
        note: noteValue,
      });

      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  listWallets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const casinoId = resolveCasinoId(req);
      if (!casinoId) {
        res.status(400).json({ status: "error", message: "casino id required" });
        return;
      }

      const rows = await this.listCasinoEconomyWallets.execute(casinoId);
      res.json({
        rows: rows.map((r) => ({
          player: r.player.toPublic(),
          walletId: r.walletId,
          balance: r.balance,
          walletActive: r.walletActive,
        })),
      });
    } catch (err) {
      next(err);
    }
  };

  listPlayerTransactions = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const casinoId = resolveCasinoId(req);
      const playerId = resolvePlayerId(req);
      if (!casinoId || !playerId) {
        res
          .status(400)
          .json({ status: "error", message: "casino id and player id required" });
        return;
      }

      const txs = await this.listPlayerCasinoTransactions.execute({
        casinoId,
        playerId,
      });
      res.json({ transactions: txs.map((t) => t.toPublic()) });
    } catch (err) {
      next(err);
    }
  };
}
