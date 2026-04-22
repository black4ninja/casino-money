import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { Role } from "../../domain/entities/Role.js";
import type { AppUser } from "../../domain/entities/AppUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import { hashPassword } from "../../infrastructure/crypto/passwordHasher.js";

export type CreateUserInput = {
  matricula: string;
  password: string;
  role: Role;
  fullName: string | null;
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
    const existing = await this.users.findByMatricula(matricula);
    if (existing) throw AuthError.matriculaTaken();

    const passwordHash = await hashPassword(input.password);
    return this.users.create({
      matricula,
      passwordHash,
      role: input.role,
      fullName: input.fullName,
    });
  }
}
