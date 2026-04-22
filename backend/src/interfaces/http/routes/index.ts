import { Router } from "express";
import { statusRoutes } from "./status.routes.js";

export function apiRoutes(appName: string): Router {
  const router = Router();
  router.use("/status", statusRoutes(appName));
  return router;
}
