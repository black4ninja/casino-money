import type { RequestHandler } from "express";
import type { Role } from "../../../domain/entities/Role.js";
import { anyRoleSatisfies } from "../../../domain/entities/Role.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

export function requireRole(...required: Role[]): RequestHandler {
  return (req, _res, next) => {
    const claims = req.user;
    if (!claims) return next(AuthError.tokenInvalid());
    if (!anyRoleSatisfies(claims.role, required)) {
      return next(AuthError.insufficientRole());
    }
    next();
  };
}
