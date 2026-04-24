import { Router } from "express";
import type { RequestHandler } from "express";
import type { EconomyController } from "../controllers/EconomyController.js";

/**
 * Economy routes, nested under a casino:
 *   POST /api/v1/casinos/:casinoId/economy/bulk-credit
 *   POST /api/v1/casinos/:casinoId/economy/players/:playerId/credit
 *   POST /api/v1/casinos/:casinoId/economy/players/:playerId/debit
 *   GET  /api/v1/casinos/:casinoId/economy/wallets
 *   GET  /api/v1/casinos/:casinoId/economy/players/:playerId/transactions
 *
 * Autorización: en vez del viejo `requireMaster`, ahora usamos
 * `requireCasinoEconomyAccess` que acepta master (siempre) o dealer con mesa
 * activa en ese casino. El dealer paga/cobra a jugadores desde la vista de su mesa.
 */
export function economyRoutes(
  ctrl: EconomyController,
  requireAuthMiddleware: RequestHandler,
  requireCasinoEconomyAccessMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware, requireCasinoEconomyAccessMiddleware);
  router.post("/bulk-credit", ctrl.bulkCredit);
  router.post("/players/:playerId/credit", ctrl.creditPlayer);
  router.post("/players/:playerId/debit", ctrl.debitPlayer);
  router.get("/wallets", ctrl.listWallets);
  router.get("/players/:playerId/transactions", ctrl.listPlayerTransactions);
  return router;
}
