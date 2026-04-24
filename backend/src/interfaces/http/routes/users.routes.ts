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
  // Register literal sub-paths (players/departamentos, dealer-candidates,
  // :collection/bulk) BEFORE the generic /:collection routes so Express
  // doesn't treat "departamentos" / "dealer-candidates" / "bulk" as
  // collection names or ids.
  router.get("/players/departamentos", ctrl.listDepartamentos);
  router.get("/dealer-candidates", ctrl.listDealerCandidatesHandler);
  router.get("/:collection", ctrl.listByCollection);
  router.post("/:collection", ctrl.createInCollection);
  router.post("/:collection/bulk", ctrl.bulkImportPlayers);
  router.patch("/:collection/:id", ctrl.updateInCollection);
  router.post("/:collection/:id/archive", ctrl.archiveInCollection);
  router.post("/:collection/:id/unarchive", ctrl.unarchiveInCollection);
  router.delete("/:collection/:id", ctrl.deleteInCollection);
  return router;
}
