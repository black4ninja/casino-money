import { Router } from "express";
import type { RequestHandler } from "express";
import type { EconomyController } from "../controllers/EconomyController.js";

/**
 * Economy routes, nested under a casino:
 *   POST /api/v1/casinos/:casinoId/economy/bulk-credit
 *   POST /api/v1/casinos/:casinoId/economy/players/:playerId/credit
 *   GET  /api/v1/casinos/:casinoId/economy/wallets
 *   GET  /api/v1/casinos/:casinoId/economy/players/:playerId/transactions
 */
export function economyRoutes(
  ctrl: EconomyController,
  requireAuthMiddleware: RequestHandler,
  requireMasterMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware, requireMasterMiddleware);
  router.post("/bulk-credit", ctrl.bulkCredit);
  router.post("/players/:playerId/credit", ctrl.creditPlayer);
  router.get("/wallets", ctrl.listWallets);
  router.get("/players/:playerId/transactions", ctrl.listPlayerTransactions);
  return router;
}
