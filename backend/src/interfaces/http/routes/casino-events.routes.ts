import { Router } from "express";
import type { RequestHandler } from "express";
import type { CasinoEventController } from "../controllers/CasinoEventController.js";

/**
 * Admin CRUD de eventos del casino. Monta como sub-router con `mergeParams`
 * porque necesita el `:casinoId` del path padre. Todo require master.
 */
export function casinoEventAdminRoutes(
  ctrl: CasinoEventController,
  requireAuthMiddleware: RequestHandler,
  requireMasterMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware, requireMasterMiddleware);
  router.get("/", ctrl.list);
  router.post("/", ctrl.create);
  router.patch("/:eventId", ctrl.update);
  router.post("/:eventId/activate", ctrl.activate);
  router.post("/:eventId/deactivate", ctrl.deactivate);
  router.delete("/:eventId", ctrl.delete);
  return router;
}

/**
 * Endpoint para jugadores/dealers autenticados — sólo eventos en curso.
 * Se consume mediante polling desde el dashboard del jugador para mostrar
 * el banner "Evento en curso" sin obligar a recargar.
 */
export function casinoEventPublicRoutes(
  ctrl: CasinoEventController,
  requireAuthMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware);
  router.get("/", ctrl.listActive);
  return router;
}
