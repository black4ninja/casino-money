import { Router } from "express";
import type { RequestHandler } from "express";
import type { MeController } from "../controllers/MeController.js";

/**
 * "Me"-scoped endpoints — read-only views over the caller's own data.
 * Requires auth but no specific role; a master hitting it just sees an empty
 * list (they don't get mesas assigned to them by convention).
 */
export function meRoutes(
  ctrl: MeController,
  requireAuthMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.use(requireAuthMiddleware);
  router.get("/mesas", ctrl.myMesas);
  router.get("/casinos", ctrl.myCasinos);
  router.get("/casinos/:casinoId/mesas", ctrl.myCasinoMesas);
  router.get(
    "/casinos/:casinoId/mesas/:mesaId/spin/last",
    ctrl.myCasinoMesaLastSpin,
  );
  router.patch("/alias", ctrl.patchAlias);
  return router;
}
