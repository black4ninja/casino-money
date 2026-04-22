import type Parse from "parse/node";
import { AppUser } from "../../../domain/entities/AppUser.js";
import type { Role } from "../../../domain/entities/Role.js";
import { isRole } from "../../../domain/entities/Role.js";
import type {
  AppUserRepo,
  CreateAppUserInput,
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
    active: obj.get("active") ?? true,
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

  async count(): Promise<number> {
    return this.q().count({ useMasterKey: true });
  }

  async findById(id: string): Promise<AppUser | null> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      return toEntity(obj);
    } catch {
      return null;
    }
  }

  async findByMatricula(matricula: string): Promise<AppUser | null> {
    const obj = await this.q()
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
    obj.set("active", true);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async listByRole(role: Role): Promise<AppUser[]> {
    const results = await this.q()
      .equalTo("role", role)
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }
}
