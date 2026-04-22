import type { AppSession } from "../entities/AppSession.js";

export type CreateAppSessionInput = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
};

export interface AppSessionRepo {
  create(input: CreateAppSessionInput): Promise<AppSession>;
  findByTokenHash(hash: string): Promise<AppSession | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
}
