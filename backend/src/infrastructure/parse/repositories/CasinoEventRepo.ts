import type Parse from "parse/node";
import {
  CasinoEvent,
  isCasinoEventType,
} from "../../../domain/entities/CasinoEvent.js";
import type {
  CasinoEventRepo,
  CreateCasinoEventInput,
  UpdateCasinoEventInput,
} from "../../../domain/ports/CasinoEventRepo.js";

const CLASS = "CasinoEvent";
const CASINO_CLASS = "Casino";

/**
 * Persistencia Parse. `casino` se guarda como pointer (ver
 * memory/project_parse_pointers_for_relations). El dominio expone sólo el id
 * como string; este repo es el único que traduce string ↔ pointer.
 */
export class ParseCasinoEventRepo implements CasinoEventRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  private qAlive() {
    return this.q().notEqualTo("exists", false);
  }

  private casinoPointer(casinoId: string): Parse.Object {
    const Casino = this.parse.Object.extend(CASINO_CLASS);
    return Casino.createWithoutData(casinoId);
  }

  private toEntity(obj: Parse.Object): CasinoEvent {
    const casinoPtr = obj.get("casino") as Parse.Object | undefined;
    const casinoId = casinoPtr?.id;
    if (!casinoId) {
      throw new Error(`CasinoEvent ${obj.id} is missing the casino pointer`);
    }
    const type = obj.get("type");
    if (!isCasinoEventType(type)) {
      throw new Error(`CasinoEvent ${obj.id} has invalid type: ${type}`);
    }
    const name = obj.get("name");
    if (typeof name !== "string" || name.length === 0) {
      throw new Error(`CasinoEvent ${obj.id} is missing name`);
    }
    return new CasinoEvent({
      id: obj.id as string,
      casinoId,
      name,
      type,
      active: obj.get("active") ?? false,
      exists: obj.get("exists") ?? true,
      createdAt: obj.createdAt ?? new Date(),
      updatedAt: obj.updatedAt ?? obj.createdAt ?? new Date(),
    });
  }

  async findByIdIncludingDeleted(id: string): Promise<CasinoEvent | null> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      return this.toEntity(obj);
    } catch {
      return null;
    }
  }

  async findById(id: string): Promise<CasinoEvent | null> {
    const ev = await this.findByIdIncludingDeleted(id);
    if (!ev) return null;
    if (!ev.exists) return null;
    return ev;
  }

  async listByCasino(casinoId: string): Promise<CasinoEvent[]> {
    const results = await this.qAlive()
      .equalTo("casino", this.casinoPointer(casinoId))
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map((o) => this.toEntity(o));
  }

  async listActiveByCasino(casinoId: string): Promise<CasinoEvent[]> {
    const results = await this.qAlive()
      .equalTo("casino", this.casinoPointer(casinoId))
      .equalTo("active", true)
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map((o) => this.toEntity(o));
  }

  async create(input: CreateCasinoEventInput): Promise<CasinoEvent> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("casino", this.casinoPointer(input.casinoId));
    obj.set("name", input.name);
    obj.set("type", input.type);
    // Se crean inactivos; el admin los activa explícitamente para que los
    // jugadores vean el banner. Evita que un evento recién creado dispare
    // multiplicadores por accidente.
    obj.set("active", false);
    obj.set("exists", true);
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async update(id: string, patch: UpdateCasinoEventInput): Promise<CasinoEvent> {
    const obj = await this.q().get(id, { useMasterKey: true });
    if (patch.name !== undefined) {
      obj.set("name", patch.name);
    }
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async setActive(id: string, active: boolean): Promise<CasinoEvent> {
    const obj = await this.q().get(id, { useMasterKey: true });
    obj.set("active", active);
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async softDelete(id: string): Promise<void> {
    const obj = await this.q().get(id, { useMasterKey: true });
    obj.set("active", false);
    obj.set("exists", false);
    await obj.save(null, { useMasterKey: true });
  }
}
