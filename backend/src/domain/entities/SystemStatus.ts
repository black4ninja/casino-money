export type HealthState = "ok" | "degraded" | "down";

export class SystemStatus {
  constructor(
    public readonly state: HealthState,
    public readonly app: string,
    public readonly timestamp: Date,
  ) {}

  toJSON() {
    return {
      status: this.state,
      app: this.app,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
