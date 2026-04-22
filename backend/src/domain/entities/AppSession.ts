export type AppSessionProps = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  createdAt: Date;
};

export class AppSession {
  readonly id: string;
  readonly userId: string;
  readonly refreshTokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;

  constructor(props: AppSessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.refreshTokenHash = props.refreshTokenHash;
    this.expiresAt = props.expiresAt;
    this.revokedAt = props.revokedAt;
    this.userAgent = props.userAgent;
    this.createdAt = props.createdAt;
  }

  isActive(now = new Date()): boolean {
    return this.revokedAt === null && this.expiresAt > now;
  }
}
