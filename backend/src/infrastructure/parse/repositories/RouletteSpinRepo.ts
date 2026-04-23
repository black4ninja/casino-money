import type Parse from "parse/node";
import { RouletteSpin } from "../../../domain/entities/RouletteSpin.js";
import type {
  RouletteSpinRepo,
  CreateRouletteSpinInput,
} from "../../../domain/ports/RouletteSpinRepo.js";

const CLASS = "RouletteSpin";
const MESA_CLASS = "Mesa";
const USER_CLASS = "AppUser";

/**
 * Persistence adapter. `mesa` and `tallador` are Parse pointers (see
 * memory/project_parse_pointers_for_relations.md). Domain exposes ids.
 */
export class ParseRouletteSpinRepo implements RouletteSpinRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  private mesaPointer(mesaId: string): Parse.Object {
    const Mesa = this.parse.Object.extend(MESA_CLASS);
    return Mesa.createWithoutData(mesaId);
  }

  private userPointer(userId: string): Parse.Object {
    const User = this.parse.Object.extend(USER_CLASS);
    return User.createWithoutData(userId);
  }

  private toEntity(obj: Parse.Object): RouletteSpin {
    const mesaPtr = obj.get("mesa") as Parse.Object | undefined;
    const talladorPtr = obj.get("tallador") as Parse.Object | undefined;
    if (!mesaPtr?.id) {
      throw new Error(`RouletteSpin ${obj.id} is missing mesa pointer`);
    }
    if (!talladorPtr?.id) {
      throw new Error(`RouletteSpin ${obj.id} is missing tallador pointer`);
    }
    return new RouletteSpin({
      id: obj.id as string,
      mesaId: mesaPtr.id,
      talladorId: talladorPtr.id,
      patternId: obj.get("patternId"),
      createdAt: obj.createdAt ?? new Date(),
    });
  }

  async create(input: CreateRouletteSpinInput): Promise<RouletteSpin> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("mesa", this.mesaPointer(input.mesaId));
    obj.set("tallador", this.userPointer(input.talladorId));
    obj.set("patternId", input.patternId);
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async findLastByMesa(mesaId: string): Promise<RouletteSpin | null> {
    const obj = await this.q()
      .equalTo("mesa", this.mesaPointer(mesaId))
      .descending("createdAt")
      .first({ useMasterKey: true });
    return obj ? this.toEntity(obj) : null;
  }
}
