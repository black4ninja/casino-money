import type Parse from "parse/node";
import { AppUser } from "../../../domain/entities/AppUser.js";
import type { Role } from "../../../domain/entities/Role.js";
import { isRole } from "../../../domain/entities/Role.js";
import type {
  AppUserRepo,
  CreateAppUserInput,
  UpdateAppUserInput,
} from "../../../domain/ports/AppUserRepo.js";

const CLASS = "AppUser";

function toEntity(obj: Parse.Object): AppUser {
  const role = obj.get("role");
  if (!isRole(role)) {
    throw new Error(`AppUser ${obj.id} has invalid role: ${role}`);
  }
  return new AppUser({
    id: obj.id as string,
    matricula: obj.get("matricula"),
    role,
    fullName: obj.get("fullName") ?? null,
    departamento: obj.get("departamento") ?? null,
    alias: obj.get("alias") ?? null,
    active: obj.get("active") ?? true,
    // Default to true for legacy rows that predate the flag.
    exists: obj.get("exists") ?? true,
    createdAt: obj.createdAt ?? new Date(),
  });
}

export class ParseAppUserRepo implements AppUserRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  /** Query scoped to non-deleted rows only (exists !== false). */
  private qAlive() {
    return this.q().notEqualTo("exists", false);
  }

  async count(): Promise<number> {
    return this.qAlive().count({ useMasterKey: true });
  }

  async findByIdIncludingDeleted(id: string): Promise<AppUser | null> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      return toEntity(obj);
    } catch {
      return null;
    }
  }

  async findById(id: string): Promise<AppUser | null> {
    const user = await this.findByIdIncludingDeleted(id);
    if (!user) return null;
    if (!user.exists) return null;
    return user;
  }

  async findByMatricula(matricula: string): Promise<AppUser | null> {
    const obj = await this.qAlive()
      .equalTo("matricula", matricula)
      .first({ useMasterKey: true });
    return obj ? toEntity(obj) : null;
  }

  async getPasswordHash(id: string): Promise<string | null> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      return obj.get("passwordHash") ?? null;
    } catch {
      return null;
    }
  }

  async create(input: CreateAppUserInput): Promise<AppUser> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("matricula", input.matricula);
    obj.set("passwordHash", input.passwordHash);
    obj.set("role", input.role);
    obj.set("fullName", input.fullName);
    obj.set("departamento", input.departamento);
    obj.set("alias", null);
    obj.set("active", true);
    obj.set("exists", true);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async listByRole(role: Role): Promise<AppUser[]> {
    const results = await this.qAlive()
      .equalTo("role", role)
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }

  async listByRoles(roles: readonly Role[]): Promise<AppUser[]> {
    if (roles.length === 0) return [];
    const results = await this.qAlive()
      .containedIn("role", roles as Role[])
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }

  async listActivePlayersByDepartamentos(
    departamentos: string[],
  ): Promise<AppUser[]> {
    const clean = Array.from(
      new Set(
        departamentos
          .map((d) => (typeof d === "string" ? d.trim() : ""))
          .filter((d) => d.length > 0),
      ),
    );
    if (clean.length === 0) return [];
    const results = await this.qAlive()
      .equalTo("role", "player")
      .equalTo("active", true)
      .containedIn("departamento", clean)
      .ascending("fullName")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }

  async listPlayerDepartamentos(): Promise<string[]> {
    // Parse has no distinct op over non-master-key queries, so we pull the
    // players and reduce locally. Player volume (<1000) makes this fine.
    const results = await this.qAlive()
      .equalTo("role", "player")
      .equalTo("active", true)
      .select("departamento")
      .limit(1000)
      .find({ useMasterKey: true });
    const set = new Set<string>();
    for (const obj of results) {
      const d = obj.get("departamento");
      if (typeof d === "string") {
        const trimmed = d.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }

  async update(id: string, patch: UpdateAppUserInput): Promise<AppUser> {
    const obj = await this.q().get(id, { useMasterKey: true });
    if (patch.fullName !== undefined) {
      const trimmed = patch.fullName?.trim();
      obj.set("fullName", trimmed ? trimmed : null);
    }
    if (patch.departamento !== undefined) {
      const trimmed = patch.departamento?.trim();
      obj.set("departamento", trimmed ? trimmed : null);
    }
    if (patch.alias !== undefined) {
      const trimmed = patch.alias?.trim();
      obj.set("alias", trimmed ? trimmed : null);
    }
    if (patch.passwordHash !== undefined) {
      obj.set("passwordHash", patch.passwordHash);
    }
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async setActive(id: string, active: boolean): Promise<AppUser> {
    const obj = await this.q().get(id, { useMasterKey: true });
    obj.set("active", active);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async softDelete(id: string): Promise<void> {
    const obj = await this.q().get(id, { useMasterKey: true });
    obj.set("active", false);
    obj.set("exists", false);
    await obj.save(null, { useMasterKey: true });
  }
}
