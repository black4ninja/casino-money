import type Parse from "parse/node";
import { PatternRaceBet, isPatternRaceBetStatus } from "../../../domain/entities/PatternRaceBet.js";
import {
  isPatternId,
  isBetKind,
} from "../../../domain/entities/patternRace/patternCatalog.js";
import type {
  CreatePatternRaceBetInput,
  PatternRaceBetRepo,
  SettlePatternRaceBetInput,
} from "../../../domain/ports/PatternRaceBetRepo.js";

const CLASS = "PatternRaceBet";
const CASINO_CLASS = "Casino";
const USER_CLASS = "AppUser";
const WALLET_CLASS = "Wallet";

/**
 * Persistence adapter. casino/player/wallet van como Parse pointers; el
 * domain expone solo ids (ver memory/project_parse_pointers_for_relations).
 */
export class ParsePatternRaceBetRepo implements PatternRaceBetRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  private casinoPointer(casinoId: string): Parse.Object {
    const Obj = this.parse.Object.extend(CASINO_CLASS);
    return Obj.createWithoutData(casinoId);
  }

  private userPointer(userId: string): Parse.Object {
    const Obj = this.parse.Object.extend(USER_CLASS);
    return Obj.createWithoutData(userId);
  }

  private walletPointer(walletId: string): Parse.Object {
    const Obj = this.parse.Object.extend(WALLET_CLASS);
    return Obj.createWithoutData(walletId);
  }

  private toEntity(obj: Parse.Object): PatternRaceBet {
    const casinoPtr = obj.get("casino") as Parse.Object | undefined;
    const playerPtr = obj.get("player") as Parse.Object | undefined;
    const walletPtr = obj.get("wallet") as Parse.Object | undefined;
    if (!casinoPtr?.id || !playerPtr?.id || !walletPtr?.id) {
      throw new Error(`PatternRaceBet ${obj.id} has invalid pointers`);
    }
    const patternId = obj.get("patternId");
    if (!isPatternId(patternId)) {
      throw new Error(`PatternRaceBet ${obj.id} has invalid patternId`);
    }
    const kind = obj.get("kind");
    if (!isBetKind(kind)) {
      throw new Error(`PatternRaceBet ${obj.id} has invalid kind`);
    }
    const status = obj.get("status");
    if (!isPatternRaceBetStatus(status)) {
      throw new Error(`PatternRaceBet ${obj.id} has invalid status`);
    }
    const settledAtRaw = obj.get("settledAt");
    return new PatternRaceBet({
      id: obj.id as string,
      casinoId: casinoPtr.id,
      playerId: playerPtr.id,
      walletId: walletPtr.id,
      cycleIndex: obj.get("cycleIndex") ?? 0,
      patternId,
      kind,
      amount: obj.get("amount") ?? 0,
      status,
      payout: obj.get("payout") ?? 0,
      betBatchId: obj.get("betBatchId"),
      payoutBatchId: obj.get("payoutBatchId") ?? null,
      createdAt: obj.createdAt ?? new Date(),
      settledAt: settledAtRaw instanceof Date ? settledAtRaw : null,
    });
  }

  async create(input: CreatePatternRaceBetInput): Promise<PatternRaceBet> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("casino", this.casinoPointer(input.casinoId));
    obj.set("player", this.userPointer(input.playerId));
    obj.set("wallet", this.walletPointer(input.walletId));
    obj.set("cycleIndex", input.cycleIndex);
    obj.set("patternId", input.patternId);
    obj.set("kind", input.kind);
    obj.set("amount", input.amount);
    obj.set("status", "open");
    obj.set("payout", 0);
    obj.set("betBatchId", input.betBatchId);
    obj.set("payoutBatchId", null);
    obj.set("settledAt", null);
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async findById(id: string): Promise<PatternRaceBet | null> {
    try {
      const obj = await this.q().get(id, { useMasterKey: true });
      return this.toEntity(obj);
    } catch {
      return null;
    }
  }

  async findByBetBatchId(betBatchId: string): Promise<PatternRaceBet | null> {
    const obj = await this.q()
      .equalTo("betBatchId", betBatchId)
      .first({ useMasterKey: true });
    return obj ? this.toEntity(obj) : null;
  }

  async countOpenForPlayerAndCycle(
    casinoId: string,
    playerId: string,
    cycleIndex: number,
  ): Promise<number> {
    return this.q()
      .equalTo("casino", this.casinoPointer(casinoId))
      .equalTo("player", this.userPointer(playerId))
      .equalTo("cycleIndex", cycleIndex)
      .equalTo("status", "open")
      .count({ useMasterKey: true });
  }

  async listOpenByCasinoAndCycle(
    casinoId: string,
    cycleIndex: number,
  ): Promise<PatternRaceBet[]> {
    const results = await this.q()
      .equalTo("casino", this.casinoPointer(casinoId))
      .equalTo("cycleIndex", cycleIndex)
      .equalTo("status", "open")
      .limit(10_000)
      .find({ useMasterKey: true });
    return results.map((o) => this.toEntity(o));
  }

  async listRecentByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
    limit = 20,
  ): Promise<PatternRaceBet[]> {
    const results = await this.q()
      .equalTo("casino", this.casinoPointer(casinoId))
      .equalTo("player", this.userPointer(playerId))
      .descending("createdAt")
      .limit(limit)
      .find({ useMasterKey: true });
    return results.map((o) => this.toEntity(o));
  }

  async settle(input: SettlePatternRaceBetInput): Promise<PatternRaceBet> {
    const obj = await this.q().get(input.id, { useMasterKey: true });
    obj.set("status", input.status);
    obj.set("payout", input.payout);
    obj.set("payoutBatchId", input.payoutBatchId);
    obj.set("settledAt", new Date());
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }
}
