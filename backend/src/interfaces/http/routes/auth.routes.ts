import { Router } from "express";
import type { AuthController } from "../controllers/AuthController.js";
import type { RequestHandler } from "express";

export function authRoutes(
  ctrl: AuthController,
  requireAuthMiddleware: RequestHandler,
): Router {
  const router = Router();
  // Public pre-login probe: is this matrícula a staff account that needs a
  // password? Drives whether the UI reveals the password field. Intentionally
  // unauthenticated (no session yet exists), returns only a boolean so it
  // can't be used to enumerate users beyond what /login would already reveal.
  router.get("/lookup", ctrl.handleLookup);
  router.post("/login", ctrl.handleLogin);
  router.post("/refresh", ctrl.handleRefresh);
  router.post("/logout", ctrl.handleLogout);
  router.get("/me", requireAuthMiddleware, ctrl.handleMe);
  return router;
}
