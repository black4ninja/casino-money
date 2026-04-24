import type { AuctionRepo } from "../../../domain/ports/AuctionRepo.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { Auction } from "../../../domain/entities/Auction.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

export type SetAuctionInitialValueInput = {
  casinoId: string;
  initialValue: number;
};

const MIN_INITIAL = 100;
const MAX_INITIAL = 10_000_000;

/**
 * El anunciador setea el piso de la puja. Limpia al pujador actual —
 * un nuevo valor inicial equivale a relanzar la puja, así que nadie
 * tiene paleta en alto hasta que alguien la levante con el nuevo precio.
 * Requiere modo subasta activo en el casino.
 */
export class SetAuctionInitialValueUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly auctions: AuctionRepo,
  ) {}

  async execute(input: SetAuctionInitialValueInput): Promise<Auction> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.subastaActive) {
      throw AuthError.validation(
        "El casino no está en modo subasta. Actívalo antes de operar.",
      );
    }
    if (!Number.isFinite(input.initialValue) || input.initialValue < MIN_INITIAL) {
      throw AuthError.validation(
        `El valor inicial debe ser al menos $${MIN_INITIAL}.`,
      );
    }
    if (input.initialValue > MAX_INITIAL) {
      throw AuthError.validation(
        `El valor inicial no puede exceder $${MAX_INITIAL}.`,
      );
    }
    const existing = await this.auctions.findByCasino(input.casinoId);
    const nextRound = existing ? existing.roundNumber : 1;
    // Snapshot: si había alguien pujando al precio anterior, guarda su
    // oferta como "última en firme" antes de pisar con el nuevo piso.
    const snapshot = snapshotPreviousOffer(existing);
    return this.auctions.upsertByCasino({
      casinoId: input.casinoId,
      currentBid: Math.floor(input.initialValue),
      currentBidderId: null,
      currentBidderAlias: null,
      lastConfirmedBid: snapshot.bid,
      lastConfirmedBidderId: snapshot.id,
      lastConfirmedBidderAlias: snapshot.alias,
      lastSoldBid: existing?.lastSoldBid ?? null,
      lastSoldBidderId: existing?.lastSoldBidderId ?? null,
      lastSoldBidderAlias: existing?.lastSoldBidderAlias ?? null,
      roundNumber: nextRound,
    });
  }
}

function snapshotPreviousOffer(prev: {
  currentBid: number;
  currentBidderId: string | null;
  currentBidderAlias: string | null;
  lastConfirmedBid: number | null;
  lastConfirmedBidderId: string | null;
  lastConfirmedBidderAlias: string | null;
} | null): {
  bid: number | null;
  id: string | null;
  alias: string | null;
} {
  if (!prev) return { bid: null, id: null, alias: null };
  // Si había paleta en alto al precio viejo, esa es la "última oferta firme".
  if (prev.currentBidderId && prev.currentBidderAlias) {
    return {
      bid: prev.currentBid,
      id: prev.currentBidderId,
      alias: prev.currentBidderAlias,
    };
  }
  // Sin paleta actual: conservamos la última confirmada que ya había
  // (no la sobrescribimos con "nada" — ese historial importa).
  return {
    bid: prev.lastConfirmedBid,
    id: prev.lastConfirmedBidderId,
    alias: prev.lastConfirmedBidderAlias,
  };
}
