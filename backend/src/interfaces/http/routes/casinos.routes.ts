import { Router } from "express";
import type { RequestHandler } from "express";
import type { CasinoController } from "../controllers/CasinoController.js";

export function casinoRoutes(
  ctrl: CasinoController,
  requireAuthMiddleware: RequestHandler,
  requireMasterMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.use(requireAuthMiddleware, requireMasterMiddleware);
  router.get("/", ctrl.list);
  router.get("/:id", ctrl.show);
  router.get("/:id/players", ctrl.listPlayers);
  router.post("/", ctrl.create);
  router.patch("/:id", ctrl.update);
  router.post("/:id/archive", ctrl.archive);
  router.post("/:id/unarchive", ctrl.unarchive);
  router.post("/:id/subasta", ctrl.setSubasta);
  router.delete("/:id", ctrl.delete);
  return router;
}
