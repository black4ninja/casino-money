import { Router } from "express";
import { StatusController } from "../controllers/StatusController.js";
import { GetSystemStatus } from "../../../application/use-cases/GetSystemStatus.js";

export function statusRoutes(appName: string): Router {
  const router = Router();
  const controller = new StatusController(new GetSystemStatus(appName));
  router.get("/", controller.get);
  return router;
}
