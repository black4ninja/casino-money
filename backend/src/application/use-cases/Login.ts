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
  /**
   * Optional. Required (and verified) only for staff roles (master, dealer).
   * Player accounts log in with just the matrícula — by project convention
   * students don't manage credentials.
   */
  password?: string;
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
 *
 * Password policy is role-driven, not matrícula-shape-driven — the string
 * format ("A…" vs "L…") is not reliable for role inference, so the DB is
 * the single source of truth.
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

    const staff = user.role === "master" || user.role === "dealer";
    if (staff) {
      if (!input.password || input.password.length === 0) {
        throw AuthError.passwordRequired();
      }
      const hash = await this.users.getPasswordHash(user.id);
      if (!hash) throw AuthError.invalidCredentials();
      const ok = await verifyPassword(input.password, hash);
      if (!ok) throw AuthError.invalidCredentials();
    }
    // Players: no password check. Matrícula match + active is enough.

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
