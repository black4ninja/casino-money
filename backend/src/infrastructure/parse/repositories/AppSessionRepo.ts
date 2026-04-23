import type Parse from "parse/node";
import { AppSession } from "../../../domain/entities/AppSession.js";
import type {
  AppSessionRepo,
  CreateAppSessionInput,
} from "../../../domain/ports/AppSessionRepo.js";

const CLASS = "AppSession";
const USER_CLASS = "AppUser";

/**
 * Persistence adapter. Relations are Parse pointers (see
 * memory/project_parse_pointers_for_relations.md) — the domain/port stay
 * string-id-based and this layer is the only place that translates.
 */
export class ParseAppSessionRepo implements AppSessionRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  private userPointer(userId: string): Parse.Object {
    const User = this.parse.Object.extend(USER_CLASS);
    return User.createWithoutData(userId);
  }

  private toEntity(obj: Parse.Object): AppSession {
    const userPtr = obj.get("user") as Parse.Object | undefined;
    const userId = userPtr?.id;
    if (!userId) {
      throw new Error(`AppSession ${obj.id} is missing the user pointer`);
    }
    return new AppSession({
      id: obj.id as string,
      userId,
      refreshTokenHash: obj.get("refreshTokenHash"),
      expiresAt: obj.get("expiresAt"),
      revokedAt: obj.get("revokedAt") ?? null,
      userAgent: obj.get("userAgent") ?? null,
      createdAt: obj.createdAt ?? new Date(),
    });
  }

  async create(input: CreateAppSessionInput): Promise<AppSession> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("user", this.userPointer(input.userId));
    obj.set("refreshTokenHash", input.refreshTokenHash);
    obj.set("expiresAt", input.expiresAt);
    obj.set("revokedAt", null);
    obj.set("userAgent", input.userAgent);
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async findByTokenHash(hash: string): Promise<AppSession | null> {
    const obj = await this.q()
      .equalTo("refreshTokenHash", hash)
      .first({ useMasterKey: true });
    return obj ? this.toEntity(obj) : null;
  }

  async revoke(id: string): Promise<void> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      obj.set("revokedAt", new Date());
      await obj.save(null, { useMasterKey: true });
    } catch {
      // no-op: idempotent
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const results = await this.q()
      .equalTo("user", this.userPointer(userId))
      .equalTo("revokedAt", null)
      .find({ useMasterKey: true });
    const now = new Date();
    await Promise.all(
      results.map((o: Parse.Object) => {
        o.set("revokedAt", now);
        return o.save(null, { useMasterKey: true });
      }),
    );
  }
}
