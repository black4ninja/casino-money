import type Parse from "parse/node";
import { Auction } from "../../../domain/entities/Auction.js";
import type {
  AuctionRepo,
  UpsertAuctionInput,
} from "../../../domain/ports/AuctionRepo.js";

const CLASS = "Auction";
const CASINO_CLASS = "Casino";

function toEntity(obj: Parse.Object): Auction {
  const casinoPtr = obj.get("casino");
  const casinoId: string =
    casinoPtr && typeof casinoPtr === "object" && "id" in casinoPtr
      ? ((casinoPtr as Parse.Object).id as string)
      : "";
  return new Auction({
    id: obj.id as string,
    casinoId,
    currentBid: obj.get("currentBid") ?? 0,
    currentBidderId: obj.get("currentBidderId") ?? null,
    currentBidderAlias: obj.get("currentBidderAlias") ?? null,
    lastConfirmedBid: obj.get("lastConfirmedBid") ?? null,
    lastConfirmedBidderId: obj.get("lastConfirmedBidderId") ?? null,
    lastConfirmedBidderAlias: obj.get("lastConfirmedBidderAlias") ?? null,
    lastSoldBid: obj.get("lastSoldBid") ?? null,
    lastSoldBidderId: obj.get("lastSoldBidderId") ?? null,
    lastSoldBidderAlias: obj.get("lastSoldBidderAlias") ?? null,
    roundNumber: obj.get("roundNumber") ?? 1,
    updatedAt: obj.updatedAt ?? new Date(),
    createdAt: obj.createdAt ?? new Date(),
  });
}

export class ParseAuctionRepo implements AuctionRepo {
  constructor(private readonly parse: typeof Parse) {}

  private q() {
    const Query = this.parse.Query;
    const Obj = this.parse.Object.extend(CLASS);
    return new Query(Obj);
  }

  private casinoPointer(casinoId: string): Parse.Object {
    const C = this.parse.Object.extend(CASINO_CLASS);
    return C.createWithoutData(casinoId);
  }

  async findByCasino(casinoId: string): Promise<Auction | null> {
    const obj = await this.q()
      .equalTo("casino", this.casinoPointer(casinoId))
      .first({ useMasterKey: true });
    return obj ? toEntity(obj) : null;
  }

  async upsertByCasino(input: UpsertAuctionInput): Promise<Auction> {
    const existing = await this.q()
      .equalTo("casino", this.casinoPointer(input.casinoId))
      .first({ useMasterKey: true });
    const obj =
      existing ?? new (this.parse.Object.extend(CLASS))();
    if (!existing) {
      obj.set("casino", this.casinoPointer(input.casinoId));
    }
    obj.set("currentBid", input.currentBid);
    obj.set("currentBidderId", input.currentBidderId);
    obj.set("currentBidderAlias", input.currentBidderAlias);
    obj.set("lastConfirmedBid", input.lastConfirmedBid);
    obj.set("lastConfirmedBidderId", input.lastConfirmedBidderId);
    obj.set("lastConfirmedBidderAlias", input.lastConfirmedBidderAlias);
    obj.set("lastSoldBid", input.lastSoldBid);
    obj.set("lastSoldBidderId", input.lastSoldBidderId);
    obj.set("lastSoldBidderAlias", input.lastSoldBidderAlias);
    obj.set("roundNumber", input.roundNumber);
    await obj.save(null, { useMasterKey: true });
    return toEntity(obj);
  }
}
