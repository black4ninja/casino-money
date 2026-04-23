import type Parse from "parse/node";
import { SlotMachineSpin } from "../../../domain/entities/SlotMachineSpin.js";
import type {
  CreateSlotMachineSpinInput,
  SlotMachineSpinRepo,
} from "../../../domain/ports/SlotMachineSpinRepo.js";

const CLASS = "SlotMachineSpin";
const CASINO_CLASS = "Casino";
const USER_CLASS = "AppUser";
const WALLET_CLASS = "Wallet";

/**
 * Persistence adapter. `casino`, `player` y `wallet` se guardan como Parse
 * pointers (ver memory/project_parse_pointers_for_relations.md); el domain
 * expone solo ids.
 */
export class ParseSlotMachineSpinRepo implements SlotMachineSpinRepo {
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

  private toEntity(obj: Parse.Object): SlotMachineSpin {
    const casinoPtr = obj.get("casino") as Parse.Object | undefined;
    const playerPtr = obj.get("player") as Parse.Object | undefined;
    const walletPtr = obj.get("wallet") as Parse.Object | undefined;
    if (!casinoPtr?.id || !playerPtr?.id || !walletPtr?.id) {
      throw new Error(`SlotMachineSpin ${obj.id} has invalid pointers`);
    }
    const rawResult = obj.get("result");
    if (!Array.isArray(rawResult) || rawResult.length !== 3) {
      throw new Error(`SlotMachineSpin ${obj.id} has malformed result`);
    }
    const result = rawResult as string[];
    return new SlotMachineSpin({
      id: obj.id as string,
      casinoId: casinoPtr.id,
      playerId: playerPtr.id,
      walletId: walletPtr.id,
      bet: obj.get("bet") ?? 0,
      result: [result[0]!, result[1]!, result[2]!],
      multiplier: obj.get("multiplier") ?? 0,
      payout: obj.get("payout") ?? 0,
      net: obj.get("net") ?? 0,
      batchId: obj.get("batchId"),
      createdAt: obj.createdAt ?? new Date(),
    });
  }

  async create(input: CreateSlotMachineSpinInput): Promise<SlotMachineSpin> {
    const Obj = this.parse.Object.extend(CLASS);
    const obj = new Obj();
    obj.set("casino", this.casinoPointer(input.casinoId));
    obj.set("player", this.userPointer(input.playerId));
    obj.set("wallet", this.walletPointer(input.walletId));
    obj.set("bet", input.bet);
    obj.set("result", [...input.result]);
    obj.set("multiplier", input.multiplier);
    obj.set("payout", input.payout);
    obj.set("net", input.net);
    obj.set("batchId", input.batchId);
    await obj.save(null, { useMasterKey: true });
    return this.toEntity(obj);
  }

  async findByBatchId(batchId: string): Promise<SlotMachineSpin | null> {
    const obj = await this.q()
      .equalTo("batchId", batchId)
      .first({ useMasterKey: true });
    return obj ? this.toEntity(obj) : null;
  }

  async listByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
    limit = 100,
  ): Promise<SlotMachineSpin[]> {
    const results = await this.q()
      .equalTo("casino", this.casinoPointer(casinoId))
      .equalTo("player", this.userPointer(playerId))
      .descending("createdAt")
      .limit(limit)
      .find({ useMasterKey: true });
    return results.map((obj) => this.toEntity(obj));
  }
}
