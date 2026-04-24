import type { Auction } from "../entities/Auction.js";

export type UpsertAuctionInput = {
  casinoId: string;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderAlias: string | null;
  lastConfirmedBid: number | null;
  lastConfirmedBidderId: string | null;
  lastConfirmedBidderAlias: string | null;
  lastSoldBid: number | null;
  lastSoldBidderId: string | null;
  lastSoldBidderAlias: string | null;
  roundNumber: number;
};

export interface AuctionRepo {
  /** Lee la subasta del casino; null si nunca se ha creado. */
  findByCasino(casinoId: string): Promise<Auction | null>;
  /**
   * Inserta si no existe, sobrescribe los campos dados si existe. Mantiene
   * un único registro por casino — el anunciador pisa el estado según
   * avanza la puja.
   */
  upsertByCasino(input: UpsertAuctionInput): Promise<Auction>;
}
