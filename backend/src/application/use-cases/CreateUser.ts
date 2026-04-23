import { randomBytes } from "node:crypto";
import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { Role } from "../../domain/entities/Role.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import { hashPassword } from "../../infrastructure/crypto/passwordHasher.js";

export type CreateUserInput = {
  matricula: string;
  /**
   * Required for staff (master/dealer). Optional for players — they sign in
   * without a password (see LookupMatricula). When omitted for a player we
   * still store a hash of an unguessable random string so the row keeps its
   * invariant (passwordHash always present), but it is never usable to login.
   */
  password?: string;
  role: Role;
  fullName: string | null;
  /** Player-only. Ignored for staff (stored as null). */
  departamento?: string | null;
};

export class CreateUserUseCase {
  constructor(private readonly users: AppUserRepo) {}

  async execute(input: CreateUserInput): Promise<AppUser> {
    const matricula = input.matricula.trim();
    if (!matricula) {
      throw new AuthError(
        "INVALID_CREDENTIALS",
        400,
        "Matricula must not be empty",
      );
    }

    const isStaff = input.role === "master" || input.role === "dealer";
    const rawPassword = input.password ?? "";
    if (isStaff) {
      if (rawPassword.length < 8) {
        throw new AuthError(
          "INVALID_CREDENTIALS",
          400,
          "Password must be at least 8 characters",
        );
      }
    }

    const existing = await this.users.findByMatricula(matricula);
    if (existing) throw AuthError.matriculaTaken();

    const passwordToHash =
      rawPassword.length > 0 ? rawPassword : randomBytes(24).toString("hex");
    const passwordHash = await hashPassword(passwordToHash);

    return this.users.create({
      matricula,
      passwordHash,
      role: input.role,
      fullName: input.fullName,
      departamento: isStaff ? null : (input.departamento ?? null),
    });
  }
}
