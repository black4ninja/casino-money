import type { AppSessionRepo } from "../../domain/ports/AppSessionRepo.js";
import { hashRefreshToken } from "../../infrastructure/crypto/randomToken.js";

export type LogoutInput = {
  refreshToken?: string;
  userId?: string;
  allDevices?: boolean;
};

export class LogoutUseCase {
  constructor(private readonly sessions: AppSessionRepo) {}

  async execute(input: LogoutInput): Promise<void> {
    if (input.allDevices && input.userId) {
      await this.sessions.revokeAllForUser(input.userId);
      return;
    }
    if (input.refreshToken) {
      const hash = hashRefreshToken(input.refreshToken);
      const session = await this.sessions.findByTokenHash(hash);
      if (session) await this.sessions.revoke(session.id);
    }
  }
}
