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
  // Bulk endpoint must be registered before the /:id routes so Express doesn't
  // treat "bulk" as an id.
  router.post("/:collection/bulk", ctrl.bulkImportPlayers);
  router.patch("/:collection/:id", ctrl.updateInCollection);
  router.post("/:collection/:id/archive", ctrl.archiveInCollection);
  router.post("/:collection/:id/unarchive", ctrl.unarchiveInCollection);
  router.delete("/:collection/:id", ctrl.deleteInCollection);
  return router;
}
