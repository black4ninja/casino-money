import type { AuctionRepo } from "../../../domain/ports/AuctionRepo.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { Auction } from "../../../domain/entities/Auction.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

export type AdjustAuctionOp = "add" | "mul";

export type AdjustAuctionValueInput = {
  casinoId: string;
  op: AdjustAuctionOp;
  /** Para "add": incremento en MXN (p. ej. 1000/10000/100000). Para "mul": multiplicador entero (p. ej. 2/3/4). */
  factor: number;
};

const MAX_BID = 100_000_000;

/**
 * El anunciador ajusta el valor actual. Dos modos:
 *   - "add": suma `factor` al currentBid. Los botones de +1000/+10000/+100000
 *     mapean a este modo.
 *   - "mul": multiplica currentBid por `factor`. Los botones x2/x3/x4 mapean
 *     acá. El multiplicador debe ser entero ≥ 2.
 *
 * Al ajustar el valor se limpia el pujador actual: un precio distinto
 * invalida la última paleta — hay que volver a levantarla al nuevo precio.
 * Requiere modo subasta activo y que la subasta ya tenga un valor inicial.
 */
export class AdjustAuctionValueUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly auctions: AuctionRepo,
  ) {}

  async execute(input: AdjustAuctionValueInput): Promise<Auction> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.subastaActive) {
      throw AuthError.validation(
        "El casino no está en modo subasta. Actívalo antes de operar.",
      );
    }

    const existing = await this.auctions.findByCasino(input.casinoId);
    if (!existing || existing.currentBid <= 0) {
      throw AuthError.validation(
        "Setea primero el valor inicial antes de ajustar la puja.",
      );
    }

    let next: number;
    if (input.op === "add") {
      if (!Number.isFinite(input.factor) || input.factor <= 0) {
        throw AuthError.validation("El incremento debe ser positivo.");
      }
      next = existing.currentBid + Math.floor(input.factor);
    } else if (input.op === "mul") {
      if (!Number.isInteger(input.factor) || input.factor < 2) {
        throw AuthError.validation(
          "El multiplicador debe ser un entero ≥ 2 (x2, x3, x4).",
        );
      }
      next = existing.currentBid * input.factor;
    } else {
      throw AuthError.validation("op debe ser 'add' o 'mul'.");
    }

    if (next > MAX_BID) {
      throw AuthError.validation(
        `La puja excede el máximo permitido ($${MAX_BID}).`,
      );
    }

    // Snapshot: si había una paleta al precio anterior, queda como la
    // oferta firme por si nadie iguala el nuevo precio.
    const hadBidder = !!existing.currentBidderId && !!existing.currentBidderAlias;
    return this.auctions.upsertByCasino({
      casinoId: input.casinoId,
      currentBid: next,
      currentBidderId: null,
      currentBidderAlias: null,
      lastConfirmedBid: hadBidder ? existing.currentBid : existing.lastConfirmedBid,
      lastConfirmedBidderId: hadBidder
        ? existing.currentBidderId
        : existing.lastConfirmedBidderId,
      lastConfirmedBidderAlias: hadBidder
        ? existing.currentBidderAlias
        : existing.lastConfirmedBidderAlias,
      lastSoldBid: existing.lastSoldBid,
      lastSoldBidderId: existing.lastSoldBidderId,
      lastSoldBidderAlias: existing.lastSoldBidderAlias,
      roundNumber: existing.roundNumber,
    });
  }
}
