import { Router } from "express";
import type { RequestHandler } from "express";
import type { SlotMachineController } from "../controllers/SlotMachineController.js";

/**
 * Rutas de la tragamonedas, anidadas bajo un casino.
 *
 *   POST /api/v1/casinos/:casinoId/slots/spin     → juega una tirada
 *   GET  /api/v1/casinos/:casinoId/slots/history  → historial propio del jugador
 *
 * Autenticación se requiere globalmente; la autorización adicional (solo el
 * dueño de la cuenta puede ver su propia historia; el rol debe ser player)
 * vive dentro de los use cases.
 */
export function slotsRoutes(
  ctrl: SlotMachineController,
  requireAuthMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware);
  router.post("/spin", ctrl.spin);
  router.get("/wallet", ctrl.wallet);
  router.get("/history", ctrl.history);
  return router;
}
