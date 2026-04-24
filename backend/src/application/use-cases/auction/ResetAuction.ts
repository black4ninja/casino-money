import type { AuctionRepo } from "../../../domain/ports/AuctionRepo.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { Auction } from "../../../domain/entities/Auction.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

/**
 * El anunciador cierra la ronda actual y reinicia a cero: valor=0, sin
 * pujador, roundNumber++. Se usa entre productos (ya se remataron los
 * tabiques, ahora vamos por los cuadros).
 */
export class ResetAuctionUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly auctions: AuctionRepo,
  ) {}

  async execute(casinoId: string): Promise<Auction> {
    const casino = await this.casinos.findById(casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.subastaActive) {
      throw AuthError.validation(
        "El casino no está en modo subasta. Actívalo antes de operar.",
      );
    }
    const existing = await this.auctions.findByCasino(casinoId);
    const nextRound = (existing?.roundNumber ?? 0) + 1;
    // Reset limpia la ronda completa: sin puja actual, sin oferta firme.
    // El último Vendido se conserva como referencia histórica hasta la
    // próxima venta (o hasta el siguiente reset siguiente — raro).
    return this.auctions.upsertByCasino({
      casinoId,
      currentBid: 0,
      currentBidderId: null,
      currentBidderAlias: null,
      lastConfirmedBid: null,
      lastConfirmedBidderId: null,
      lastConfirmedBidderAlias: null,
      lastSoldBid: existing?.lastSoldBid ?? null,
      lastSoldBidderId: existing?.lastSoldBidderId ?? null,
      lastSoldBidderAlias: existing?.lastSoldBidderAlias ?? null,
      roundNumber: nextRound,
    });
  }
}
