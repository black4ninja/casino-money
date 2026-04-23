import { Router } from "express";
import type { UserController } from "../controllers/UserController.js";
import type { RequestHandler } from "express";

export function userRoutes(
  ctrl: UserController,
  requireAuthMiddleware: RequestHandler,
  requireMasterMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.use(requireAuthMiddleware, requireMasterMiddleware);
  router.get("/:collection", ctrl.listByCollection);
  router.post("/:collection", ctrl.createInCollection);
  router.patch("/:collection/:id", ctrl.updateInCollection);
  router.post("/:collection/:id/archive", ctrl.archiveInCollection);
  router.post("/:collection/:id/unarchive", ctrl.unarchiveInCollection);
  router.delete("/:collection/:id", ctrl.deleteInCollection);
  return router;
}
