import type { Request, Response } from "express";
import { GetSystemStatus } from "../../../application/use-cases/GetSystemStatus.js";

export class StatusController {
  constructor(private readonly useCase: GetSystemStatus) {}

  get = (_req: Request, res: Response): void => {
    const status = this.useCase.execute();
    res.json(status.toJSON());
  };
}
