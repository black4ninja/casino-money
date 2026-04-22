import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { AppSessionRepo } from "../../domain/ports/AppSessionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import type { JwtService } from "../../infrastructure/crypto/jwtService.js";
import { verifyPassword } from "../../infrastructure/crypto/passwordHasher.js";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "../../infrastructure/crypto/randomToken.js";
import type { AppUser } from "../../domain/entities/AppUser.js";

export type LoginInput = {
  matricula: string;
  password: string;
  userAgent: string | null;
};

export type LoginOutput = {
  user: AppUser;
  accessToken: string;
  refreshToken: string;
};

/**
 * The access token is a JWT (stateless, short-lived).
 * The refresh token is an opaque 128-char hex string, stored SHA-256-hashed
 * server-side in AppSession. Rotated on every refresh, revocable on logout.
 */
export class LoginUseCase {
  constructor(
    private readonly users: AppUserRepo,
    private readonly sessions: AppSessionRepo,
    private readonly jwt: JwtService,
    private readonly refreshTtlMs: number,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.users.findByMatricula(input.matricula);
    if (!user) throw AuthError.invalidCredentials();
    if (!user.active) throw AuthError.inactiveAccount();

    const hash = await this.users.getPasswordHash(user.id);
    if (!hash) throw AuthError.invalidCredentials();
    const ok = await verifyPassword(input.password, hash);
    if (!ok) throw AuthError.invalidCredentials();

    const refreshToken = generateRefreshToken();
    await this.sessions.create({
      userId: user.id,
      refreshTokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + this.refreshTtlMs),
      userAgent: input.userAgent,
    });

    const accessToken = this.jwt.signAccess({
      sub: user.id,
      matricula: user.matricula,
      role: user.role,
    });
    return { user, accessToken, refreshToken };
  }
}
