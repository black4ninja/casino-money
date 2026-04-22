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
  return router;
}
