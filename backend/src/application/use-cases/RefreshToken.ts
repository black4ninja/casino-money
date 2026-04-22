import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppSessionRepo } from "../../domain/ports/AppSessionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import type { JwtService } from "../../infrastructure/crypto/jwtService.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../infrastructure/crypto/randomToken.js";
import type { AppUser } from "../../domain/entities/AppUser.js";

export type RefreshInput = {
  refreshToken: string;
  userAgent: string | null;
};

export type RefreshOutput = {
  user: AppUser;
  accessToken: string;
  refreshToken: string;
};

export class RefreshTokenUseCase {
  constructor(
    private readonly users: AppUserRepo,
    private readonly sessions: AppSessionRepo,
    private readonly jwt: JwtService,
    private readonly refreshTtlMs: number,
  ) {}

  async execute(input: RefreshInput): Promise<RefreshOutput> {
    const hash = hashRefreshToken(input.refreshToken);
    const session = await this.sessions.findByTokenHash(hash);
    if (!session) throw AuthError.tokenInvalid();
    if (!session.isActive()) throw AuthError.sessionRevoked();

    const user = await this.users.findById(session.userId);
    if (!user || !user.active) throw AuthError.inactiveAccount();

    // Rotate: revoke the current session, create a fresh one.
    await this.sessions.revoke(session.id);
    const newRaw = generateRefreshToken();
    await this.sessions.create({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(newRaw),
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
      userAgent: input.userAgent,
    });

    const accessToken = this.jwt.signAccess({
      sub: user.id,
      matricula: user.matricula,
      role: user.role,
    });
    return { user, accessToken, refreshToken: newRaw };
  }
}
