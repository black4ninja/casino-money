import type Parse from "parse/node";
import { Wallet } from "../../../domain/entities/Wallet.js";
import type { WalletRepo } from "../../../domain/ports/WalletRepo.js";

const CLASS = "Wallet";
const CASINO_CLASS = "Casino";
const USER_CLASS = "AppUser";

function pointerId(obj: unknown): string | null {
  if (obj && typeof obj === "object" && "id" in obj) {
    const id = (obj as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function toEntity(obj: Parse.Object): Wallet {
  const casinoId = pointerId(obj.get("casino"));
  const playerId = pointerId(obj.get("player"));
  if (!casinoId || !playerId) {
    throw new Error(`Wallet ${obj.id} has invalid pointers`);
  }
  const balanceRaw = obj.get("balance");
  const balance = typeof balanceRaw === "number" ? balanceRaw : 0;
  return new Wallet({
    id: obj.id as string,
    casinoId,
    playerId,
    balance,
    active: obj.get("active") ?? true,
    exists: obj.get("exists") ?? true,
    createdAt: obj.createdAt ?? new Date(),
  });
}

export class ParseWalletRepo implements WalletRepo {
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
    const Obj = this.parse.Object.extend(CASINO_CLASS);
    return Obj.createWithoutData(casinoId);
  }

  private userPointer(playerId: string): Parse.Object {
    const Obj = this.parse.Object.extend(USER_CLASS);
    return Obj.createWithoutData(playerId);
  }

  async findByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
  ): Promise<Wallet | null> {
    // Parse no soporta unique compound indexes custom: si una race creó dos
    // wallets para el mismo (casino, player), devolvemos la más vieja — el
    // idempotencyKey de WalletTransaction es lo que realmente previene doble
    // crédito.
    const obj = await this.qAlive()
      .equalTo("casino", this.casinoPointer(casinoId))
      .equalTo("player", this.userPointer(playerId))
      .ascending("createdAt")
      .first({ useMasterKey: true });
    return obj ? toEntity(obj) : null;
  }

  async createForCasinoAndPlayer(
    casinoId: string,
    playerId: string,
  ): Promise<Wallet> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("casino", this.casinoPointer(casinoId));
    obj.set("player", this.userPointer(playerId));
    obj.set("balance", 0);
    obj.set("active", true);
    obj.set("exists", true);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async incrementBalance(walletId: string, delta: number): Promise<number> {
    // Parse traduce `.increment()` a `$inc` de Mongo — atómico a nivel doc.
    // Este es el único path aceptado para mutar el balance.
    const obj = await this.q().get(walletId, { useMasterKey: true });
    obj.increment("balance", delta);
    await obj.save(null, { useMasterKey: true });
    const newBalance = obj.get("balance");
    return typeof newBalance === "number" ? newBalance : 0;
  }

  async findByCasino(casinoId: string): Promise<Wallet[]> {
    const results = await this.qAlive()
      .equalTo("casino", this.casinoPointer(casinoId))
      .ascending("createdAt")
      .limit(10_000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }

  async findByPlayer(playerId: string): Promise<Wallet[]> {
    const results = await this.qAlive()
      .equalTo("player", this.userPointer(playerId))
      .ascending("createdAt")
      .limit(1000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }
}
