import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";

export type LookupMatriculaOutput = {
  /**
   * True only when the matrícula resolves to an existing, non-deleted staff
   * account (master or dealer). False for:
   *   - nonexistent matrículas (the login attempt will fail with
   *     INVALID_CREDENTIALS, but we don't leak existence here),
   *   - soft-deleted rows,
   *   - player accounts (players sign in without a password).
   * The consumer (login form) uses this boolean to decide whether to show
   * the password field. Role format is not derivable from the matrícula
   * string itself — only the DB is authoritative.
   */
  requiresPassword: boolean;
};

export class LookupMatriculaUseCase {
  constructor(private readonly users: AppUserRepo) {}

  async execute(matricula: string): Promise<LookupMatriculaOutput> {
    const clean = matricula.trim();
    if (!clean) return { requiresPassword: false };
    const user = await this.users.findByMatricula(clean);
    if (!user || !user.active) return { requiresPassword: false };
    return {
      requiresPassword: user.role === "master" || user.role === "dealer",
    };
  }
}
