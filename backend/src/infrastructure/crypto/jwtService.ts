import jwt from "jsonwebtoken";
import type { Role } from "../../domain/entities/Role.js";

export type AccessClaims = {
  sub: string;
  matricula: string;
  role: Role;
};

export type RefreshClaims = {
  sub: string;
  sid: string;
};

export type JwtConfig = {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: string;
  refreshTtl: string;
};

export class JwtService {
  constructor(private readonly cfg: JwtConfig) {}

  signAccess(claims: AccessClaims): string {
    return jwt.sign(claims, this.cfg.accessSecret, {
      expiresIn: this.cfg.accessTtl as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
    });
  }

  signRefresh(claims: RefreshClaims): string {
    return jwt.sign(claims, this.cfg.refreshSecret, {
      expiresIn: this.cfg.refreshTtl as jwt.SignOptions["expiresIn"],
      algorithm: "HS256",
    });
  }

  verifyAccess(token: string): AccessClaims {
    return jwt.verify(token, this.cfg.accessSecret, {
      algorithms: ["HS256"],
    }) as AccessClaims;
  }

  verifyRefresh(token: string): RefreshClaims {
    return jwt.verify(token, this.cfg.refreshSecret, {
      algorithms: ["HS256"],
    }) as RefreshClaims;
  }
}
