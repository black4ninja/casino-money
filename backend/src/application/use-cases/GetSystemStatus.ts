import { SystemStatus } from "../../domain/entities/SystemStatus.js";

export class GetSystemStatus {
  constructor(private readonly appName: string) {}

  execute(): SystemStatus {
    return new SystemStatus("ok", this.appName, new Date());
  }
}
