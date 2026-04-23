import { Router } from "express";
import type { RequestHandler } from "express";
import type { MesaController } from "../controllers/MesaController.js";

/**
 * Mesa routes are nested under a casino:
 *   /api/v1/casinos/:casinoId/mesas
 *   /api/v1/casinos/:casinoId/mesas/:mesaId
 * The nesting keeps the parent relationship explicit in the URL and
 * naturally scopes all ops to a casino.
 */
export function mesaRoutes(
  ctrl: MesaController,
  requireAuthMiddleware: RequestHandler,
  requireMasterMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware, requireMasterMiddleware);
  router.get("/", ctrl.list);
  router.post("/", ctrl.create);
  router.patch("/:mesaId", ctrl.update);
  router.post("/:mesaId/archive", ctrl.archive);
  router.post("/:mesaId/unarchive", ctrl.unarchive);
  router.delete("/:mesaId", ctrl.delete);
  return router;
}
