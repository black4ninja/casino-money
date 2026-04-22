export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "TOKEN_INVALID"
  | "SESSION_REVOKED"
  | "INSUFFICIENT_ROLE"
  | "MATRICULA_TAKEN"
  | "INACTIVE_ACCOUNT";

export class AuthError extends Error {
  readonly status: number;
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, status: number, message: string) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }

  static invalidCredentials() {
    return new AuthError("INVALID_CREDENTIALS", 401, "Invalid credentials");
  }
  static tokenExpired() {
    return new AuthError("TOKEN_EXPIRED", 401, "Token expired");
  }
  static tokenInvalid() {
    return new AuthError("TOKEN_INVALID", 401, "Token invalid");
  }
  static sessionRevoked() {
    return new AuthError("SESSION_REVOKED", 401, "Session revoked");
  }
  static insufficientRole() {
    return new AuthError("INSUFFICIENT_ROLE", 403, "Insufficient role");
  }
  static matriculaTaken() {
    return new AuthError("MATRICULA_TAKEN", 409, "Matricula already in use");
  }
  static inactiveAccount() {
    return new AuthError("INACTIVE_ACCOUNT", 403, "Account is inactive");
  }
}
