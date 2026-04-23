import type Parse from "parse/node";
import { Mesa } from "../../../domain/entities/Mesa.js";
import { isGameType } from "../../../domain/entities/GameType.js";
import type {
  MesaRepo,
  CreateMesaInput,
  UpdateMesaInput,
} from "../../../domain/ports/MesaRepo.js";

const CLASS = "Mesa";
const CASINO_CLASS = "Casino";
const USER_CLASS = "AppUser";

/**
 * Persistence adapter. `casino` and `tallador` are Parse pointers (see
 * memory/project_parse_pointers_for_relations.md). The domain exposes the
 * ids as strings; this repo is the only place that translates to pointers.
 */
export class ParseMesaRepo implements MesaRepo {
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

  private userPointer(userId: string): Parse.Object {
    const User = this.parse.Object.extend(USER_CLASS);
    return User.createWithoutData(userId);
  }

  private toEntity(obj: Parse.Object): Mesa {
    const gameType = obj.get("gameType");
    if (!isGameType(gameType)) {
      throw new Error(`Mesa ${obj.id} has invalid gameType: ${gameType}`);
    }
    const casinoPtr = obj.get("casino") as Parse.Object | undefined;
    const casinoId = casinoPtr?.id;
    if (!casinoId) {
      throw new Error(`Mesa ${obj.id} is missing the casino pointer`);
    }
    const talladorPtr = obj.get("tallador") as Parse.Object | undefined;
    return new Mesa({
      id: obj.id as string,
      casinoId,
      gameType,
      talladorId: talladorPtr?.id ?? null,
      active: obj.get("active") ?? true,
      exists: obj.get("exists") ?? true,
      createdAt: obj.createdAt ?? new Date(),
    });
  }

  async findByIdIncludingDeleted(id: string): Promise<Mesa | null> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      return this.toEntity(obj);
    } catch {
      return null;
    }
  }

  async findById(id: string): Promise<Mesa | null> {
    const mesa = await this.findByIdIncludingDeleted(id);
    if (!mesa) return null;
    if (!mesa.exists) return null;
    return mesa;
  }

  async listByCasino(casinoId: string): Promise<Mesa[]> {
    const results = await this.qAlive()
      .equalTo("casino", this.casinoPointer(casinoId))
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map((o) => this.toEntity(o));
  }

  async listByTallador(userId: string): Promise<Mesa[]> {
    const results = await this.qAlive()
      .equalTo("tallador", this.userPointer(userId))
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map((o) => this.toEntity(o));
  }

  async create(input: CreateMesaInput): Promise<Mesa> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("casino", this.casinoPointer(input.casinoId));
    obj.set("gameType", input.gameType);
    obj.set("tallador", null);
    obj.set("active", true);
    obj.set("exists", true);
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async update(id: string, patch: UpdateMesaInput): Promise<Mesa> {
    const obj = await this.q().get(id, { useMasterKey: true });
    if (patch.gameType !== undefined) {
      obj.set("gameType", patch.gameType);
    }
    if (patch.talladorId !== undefined) {
      if (patch.talladorId === null) {
        obj.set("tallador", null);
      } else {
        obj.set("tallador", this.userPointer(patch.talladorId));
      }
    }
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async setActive(id: string, active: boolean): Promise<Mesa> {
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
