import { Router } from "express";
import type { RequestHandler } from "express";
import type { RouletteSpinController } from "../controllers/RouletteSpinController.js";

/**
 * Roulette-spin routes are nested under a mesa (the parent). Authorization
 * (caller is assigned tallador or master) is enforced inside each use case,
 * not at the route level — we only require any authenticated user here.
 *
 *   /api/v1/mesas/:mesaId/spins         POST → record a new spin
 *   /api/v1/mesas/:mesaId/spins/last    GET  → most recent spin, or null
 */
export function rouletteSpinRoutes(
  ctrl: RouletteSpinController,
  requireAuthMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware);
  router.post("/", ctrl.create);
  router.get("/last", ctrl.last);
  return router;
}
