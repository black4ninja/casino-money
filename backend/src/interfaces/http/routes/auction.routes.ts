import { Router } from "express";
import type { RequestHandler } from "express";
import type { AuctionController } from "../controllers/AuctionController.js";

/**
 * Rutas de subasta — montadas bajo dos prefijos distintos por contexto:
 *
 *   - Público (sin auth): GET /display/casinos/:casinoId/auction
 *     para proyectar el estado en la pantalla global del evento.
 *
 *   - Autenticadas bajo /me/casinos/:casinoId/auction:
 *     · GET         — lee el estado (admin o jugador).
 *     · POST raise  — levantar paleta (jugador).
 *     · POST initial / adjust / reset — controles del anunciador (master).
 *
 * La separación por export evita confundir el mount público con el
 * autenticado. El middleware de master se aplica SOLO a los endpoints
 * de control, no al GET ni al raise del jugador.
 */
export function auctionPublicRoutes(ctrl: AuctionController): Router {
  const router = Router({ mergeParams: true });
  router.get("/", ctrl.showPublic);
  return router;
}

export function auctionAuthedRoutes(
  ctrl: AuctionController,
  requireAuthMiddleware: RequestHandler,
  requireMasterMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware);
  router.get("/", ctrl.show);
  router.post("/raise-paddle", ctrl.postRaisePaddle);
  router.post("/initial", requireMasterMiddleware, ctrl.postInitial);
  router.post("/adjust", requireMasterMiddleware, ctrl.postAdjust);
  router.post("/reset", requireMasterMiddleware, ctrl.postReset);
  router.post("/sold", requireMasterMiddleware, ctrl.postSold);
  return router;
}
