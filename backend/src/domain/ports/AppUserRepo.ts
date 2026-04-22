import type { AppUser } from "../entities/AppUser.js";
import type { Role } from "../entities/Role.js";

export type CreateAppUserInput = {
  matricula: string;
  passwordHash: string;
  role: Role;
  fullName: string | null;
};

export interface AppUserRepo {
  count(): Promise<number>;
  findById(id: string): Promise<AppUser | null>;
  findByMatricula(matricula: string): Promise<AppUser | null>;
  getPasswordHash(id: string): Promise<string | null>;
  create(input: CreateAppUserInput): Promise<AppUser>;
  listByRole(role: Role): Promise<AppUser[]>;
}
