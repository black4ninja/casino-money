import { Router } from "express";
import type { RequestHandler } from "express";
import type { PatternRaceController } from "../controllers/PatternRaceController.js";

/**
 * Rutas de la Carrera de Patrones.
 *
 *   GET  /api/v1/public/casinos/:casinoId/carrera/current   (sin auth, para proyección)
 *   POST /api/v1/me/casinos/:casinoId/carrera/bets          (auth, apuesta)
 *   GET  /api/v1/me/casinos/:casinoId/carrera/bets          (auth, mis apuestas)
 */

export function carreraPublicRoutes(ctrl: PatternRaceController): Router {
  const router = Router({ mergeParams: true });
  router.get("/current", ctrl.current);
  return router;
}

export function carreraMeRoutes(
  ctrl: PatternRaceController,
  requireAuthMiddleware: RequestHandler,
): Router {
  const router = Router({ mergeParams: true });
  router.use(requireAuthMiddleware);
  router.post("/bets", ctrl.bet);
  router.get("/bets", ctrl.myBets);
  return router;
}
