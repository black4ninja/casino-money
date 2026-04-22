import { Router } from "express";
import type { AuthController } from "../controllers/AuthController.js";
import type { RequestHandler } from "express";

export function authRoutes(
  ctrl: AuthController,
  requireAuthMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.post("/login", ctrl.handleLogin);
  router.post("/refresh", ctrl.handleRefresh);
  router.post("/logout", ctrl.handleLogout);
  router.get("/me", requireAuthMiddleware, ctrl.handleMe);
  return router;
}
