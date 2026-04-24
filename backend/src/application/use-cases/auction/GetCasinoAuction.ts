import type { AuctionRepo } from "../../../domain/ports/AuctionRepo.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { Auction } from "../../../domain/entities/Auction.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

/**
 * Lee el estado actual de la subasta de un casino. Si nunca se ha
 * inicializado (el anunciador no ha seteado valor), devuelve un
 * estado "zero" — currentBid=0, sin pujador, ronda 1 — para que el
 * display pinte un placeholder coherente.
 */
export class GetCasinoAuctionUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly auctions: AuctionRepo,
  ) {}

  async execute(casinoId: string): Promise<Auction> {
    const casino = await this.casinos.findById(casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    const existing = await this.auctions.findByCasino(casinoId);
    if (existing) return existing;
    // Zero-state: ni siquiera persistimos — el upsert ocurre al primer
    // setInitial. El display muestra "sin puja activa" basándose en
    // currentBid === 0.
    return await this.auctions.upsertByCasino({
      casinoId,
      currentBid: 0,
      currentBidderId: null,
      currentBidderAlias: null,
      lastConfirmedBid: null,
      lastConfirmedBidderId: null,
      lastConfirmedBidderAlias: null,
      lastSoldBid: null,
      lastSoldBidderId: null,
      lastSoldBidderAlias: null,
      roundNumber: 1,
    });
  }
}
