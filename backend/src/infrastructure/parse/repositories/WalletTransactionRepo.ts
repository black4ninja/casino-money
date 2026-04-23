import type Parse from "parse/node";
import { WalletTransaction } from "../../../domain/entities/WalletTransaction.js";
import {
  isTransactionKind,
  isTransactionStatus,
} from "../../../domain/entities/TransactionKind.js";
import type {
  CreatePendingWalletTransactionInput,
  WalletTransactionRepo,
} from "../../../domain/ports/WalletTransactionRepo.js";

const CLASS = "WalletTransaction";
const WALLET_CLASS = "Wallet";
const CASINO_CLASS = "Casino";
const USER_CLASS = "AppUser";

function pointerId(obj: unknown): string | null {
  if (obj && typeof obj === "object" && "id" in obj) {
    const id = (obj as { id?: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function toEntity(obj: Parse.Object): WalletTransaction {
  const walletId = pointerId(obj.get("wallet"));
  const casinoId = pointerId(obj.get("casino"));
  const playerId = pointerId(obj.get("player"));
  if (!walletId || !casinoId || !playerId) {
    throw new Error(`WalletTransaction ${obj.id} has invalid pointers`);
  }
  const kind = obj.get("kind");
  if (!isTransactionKind(kind)) {
    throw new Error(
      `WalletTransaction ${obj.id} has invalid kind: ${String(kind)}`,
    );
  }
  const status = obj.get("status");
  if (!isTransactionStatus(status)) {
    throw new Error(
      `WalletTransaction ${obj.id} has invalid status: ${String(status)}`,
    );
  }
  const balanceAfterRaw = obj.get("balanceAfter");
  return new WalletTransaction({
    id: obj.id as string,
    walletId,
    casinoId,
    playerId,
    kind,
    delta: obj.get("delta") ?? 0,
    balanceAfter:
      typeof balanceAfterRaw === "number" ? balanceAfterRaw : null,
    idempotencyKey: obj.get("idempotencyKey"),
    batchId: obj.get("batchId"),
    actorId: obj.get("actorId"),
    note: obj.get("note") ?? null,
    status,
    createdAt: obj.createdAt ?? new Date(),
  });
}

export class ParseWalletTransactionRepo implements WalletTransactionRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  private walletPointer(walletId: string): Parse.Object {
    const Obj = this.parse.Object.extend(WALLET_CLASS);
    return Obj.createWithoutData(walletId);
  }

  private casinoPointer(casinoId: string): Parse.Object {
    const Obj = this.parse.Object.extend(CASINO_CLASS);
    return Obj.createWithoutData(casinoId);
  }

  private userPointer(playerId: string): Parse.Object {
    const Obj = this.parse.Object.extend(USER_CLASS);
    return Obj.createWithoutData(playerId);
  }

  async findByIdempotencyKey(key: string): Promise<WalletTransaction | null> {
    const obj = await this.q()
      .equalTo("idempotencyKey", key)
      .ascending("createdAt")
      .first({ useMasterKey: true });
    return obj ? toEntity(obj) : null;
  }

  async createPending(
    input: CreatePendingWalletTransactionInput,
  ): Promise<WalletTransaction> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("wallet", this.walletPointer(input.walletId));
    obj.set("casino", this.casinoPointer(input.casinoId));
    obj.set("player", this.userPointer(input.playerId));
    obj.set("kind", input.kind);
    obj.set("delta", input.delta);
    obj.set("balanceAfter", null);
    obj.set("idempotencyKey", input.idempotencyKey);
    obj.set("batchId", input.batchId);
    obj.set("actorId", input.actorId);
    obj.set("note", input.note);
    obj.set("status", "pending");
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async markCommitted(
    txId: string,
    balanceAfter: number,
  ): Promise<WalletTransaction> {
    const obj = await this.q().get(txId, { useMasterKey: true });
    obj.set("status", "committed");
    obj.set("balanceAfter", balanceAfter);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async markRecovered(
    txId: string,
    balanceAfter: number,
  ): Promise<WalletTransaction> {
    const obj = await this.q().get(txId, { useMasterKey: true });
    obj.set("status", "committed_recovered");
    obj.set("balanceAfter", balanceAfter);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async markFailed(txId: string, reason: string): Promise<WalletTransaction> {
    const obj = await this.q().get(txId, { useMasterKey: true });
    obj.set("status", "failed");
    // Append la razón al note para auditoría sin perder la original.
    const existingNote = obj.get("note");
    const combined = existingNote
      ? `${existingNote} | failed: ${reason}`
      : `failed: ${reason}`;
    obj.set("note", combined);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }

  async listByBatch(batchId: string): Promise<WalletTransaction[]> {
    const results = await this.q()
      .equalTo("batchId", batchId)
      .ascending("createdAt")
      .limit(10_000)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }

  async listByWallet(
    walletId: string,
    limit = 200,
  ): Promise<WalletTransaction[]> {
    const results = await this.q()
      .equalTo("wallet", this.walletPointer(walletId))
      .descending("createdAt")
      .limit(limit)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }

  async listByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
    limit = 200,
  ): Promise<WalletTransaction[]> {
    const results = await this.q()
      .equalTo("casino", this.casinoPointer(casinoId))
      .equalTo("player", this.userPointer(playerId))
      .descending("createdAt")
      .limit(limit)
      .find({ useMasterKey: true });
    return results.map(toEntity);
  }
}
