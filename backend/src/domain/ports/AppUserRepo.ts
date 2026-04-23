import type { AppUser } from "../entities/AppUser.js";
import type { Role } from "../entities/Role.js";

export type CreateAppUserInput = {
  matricula: string;
  passwordHash: string;
  role: Role;
  fullName: string | null;
  departamento: string | null;
};

export type UpdateAppUserInput = {
  /** If provided, overwrites fullName (empty string → null). */
  fullName?: string | null;
  /** If provided, overwrites departamento (empty string → null). Player-only. */
  departamento?: string | null;
  /** If provided, replaces the stored password hash. */
  passwordHash?: string;
};

export interface AppUserRepo {
  count(): Promise<number>;
  /** Finds by id regardless of active/exists — for internal server checks. */
  findByIdIncludingDeleted(id: string): Promise<AppUser | null>;
  /** Finds by id only if exists=true. For user-facing reads / login flows. */
  findById(id: string): Promise<AppUser | null>;
  /** Finds by matricula only if exists=true. Deleted users are invisible. */
  findByMatricula(matricula: string): Promise<AppUser | null>;
  getPasswordHash(id: string): Promise<string | null>;
  create(input: CreateAppUserInput): Promise<AppUser>;
  /** Masters listing — includes archived (active=false), excludes deleted. */
  listByRole(role: Role): Promise<AppUser[]>;
  update(id: string, patch: UpdateAppUserInput): Promise<AppUser>;
  /** Archive / unarchive — flips `active`. Does not touch `exists`. */
  setActive(id: string, active: boolean): Promise<AppUser>;
  /** Logical delete — sets exists=false AND active=false. Irreversible from UI. */
  softDelete(id: string): Promise<void>;
}
