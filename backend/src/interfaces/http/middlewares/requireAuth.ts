import type { RequestHandler } from "express";
import type { JwtService, AccessClaims } from "../../../infrastructure/crypto/jwtService.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AccessClaims;
  }
}

export function requireAuth(jwt: JwtService): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next(AuthError.tokenInvalid());
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const claims = jwt.verifyAccess(token);
      req.user = claims;
      next();
    } catch (err) {
      if (err instanceof Error && err.name === "TokenExpiredError") {
        return next(AuthError.tokenExpired());
      }
      next(AuthError.tokenInvalid());
    }
  };
}
