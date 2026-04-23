import type Parse from "parse/node";
import { Casino } from "../../../domain/entities/Casino.js";
import type {
  CasinoRepo,
  CreateCasinoInput,
  UpdateCasinoInput,
} from "../../../domain/ports/CasinoRepo.js";

const CLASS = "Casino";

function toEntity(obj: Parse.Object): Casino {
  const rawDate = obj.get("date");
  const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
  return new Casino({
    id: obj.id as string,
    name: obj.get("name"),
    date,
    active: obj.get("active") ?? true,
    exists: obj.get("exists") ?? true,
    createdAt: obj.createdAt ?? new Date(),
  });
}

export class ParseCasinoRepo implements CasinoRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  private qAlive() {
    return this.q().notEqualTo("exists", false);
  }

  async findByIdIncludingDeleted(id: string): Promise<Casino | null> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      return toEntity(obj);
    } catch {
      return null;
    }
  }

  async findById(id: string): Promise<Casino | null> {
    const casino = await this.findByIdIncludingDeleted(id);
    if (!casino) return null;
    if (!casino.exists) return null;
    return casino;
  }

  async list(): Promise<Casino[]> {
    const results = await this.qAlive()
      .ascending("date")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }

  async create(input: CreateCasinoInput): Promise<Casino> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("name", input.name);
    obj.set("date", input.date);
    obj.set("active", true);
    obj.set("exists", true);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async update(id: string, patch: UpdateCasinoInput): Promise<Casino> {
    const obj = await this.q().get(id, { useMasterKey: true });
    if (patch.name !== undefined) {
      obj.set("name", patch.name);
    }
    if (patch.date !== undefined) {
      obj.set("date", patch.date);
    }
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async setActive(id: string, active: boolean): Promise<Casino> {
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
