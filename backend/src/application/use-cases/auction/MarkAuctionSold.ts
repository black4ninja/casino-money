import type { AuctionRepo } from "../../../domain/ports/AuctionRepo.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { WalletRepo } from "../../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../../domain/ports/WalletTransactionRepo.js";
import type { Auction } from "../../../domain/entities/Auction.js";
import { AuthError } from "../../../domain/errors/AuthError.js";
import { creditPlayerCore } from "../helpers/creditPlayerCore.js";

export type MarkAuctionSoldInput = {
  casinoId: string;
  /** Usuario que operó el cierre (normalmente el master-anunciador). */
  actorId: string;
};

/**
 * El anunciador cierra la puja con "Vendido". El ganador es:
 *   1. El pujador actual (paleta en alto al precio vigente), si existe.
 *   2. Si no hay paleta actual pero hay oferta firme previa (alguien pujó
 *      antes de un ajuste de precio que nadie aceptó), se adjudica a esa
 *      oferta al precio confirmado de ese momento.
 *   3. Si no hay ni paleta ni oferta previa, el use-case rechaza — no hay
 *      a quién vender.
 *
 * Efectos económicos:
 *   - Debita el wallet del ganador por `winningBid` con kind
 *     `auction_purchase` (delta negativo). Idempotente por batchId
 *     determinista (`auction:<auctionId>:<roundNumber>`), así re-disparar
 *     el endpoint no duplica el cobro.
 *   - Si el saldo del ganador no alcanza al momento del cierre (p. ej.
 *     transfirió sus fichas después de pujar), se rechaza y el anunciador
 *     debe reconciliar manualmente (reset, re-puja, etc.).
 *
 * Post-condición (si el débito se aplica):
 *   - Se persiste en `lastSold*` para que el display lo muestre.
 *   - Se limpian current + lastConfirmed.
 *   - `roundNumber++` para pasar al siguiente artículo.
 */
export class MarkAuctionSoldUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly auctions: AuctionRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
  ) {}

  async execute(input: MarkAuctionSoldInput): Promise<Auction> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.subastaActive) {
      throw AuthError.validation(
        "El casino no está en modo subasta. Actívalo antes de operar.",
      );
    }
    const existing = await this.auctions.findByCasino(input.casinoId);
    if (!existing) {
      throw AuthError.validation("Aún no hay subasta en este casino.");
    }

    // Resuelve el ganador: paleta actual o, en su defecto, oferta firme.
    let winnerId: string | null = null;
    let winnerAlias: string | null = null;
    let winningBid: number | null = null;
    if (existing.currentBidderId && existing.currentBidderAlias) {
      winnerId = existing.currentBidderId;
      winnerAlias = existing.currentBidderAlias;
      winningBid = existing.currentBid;
    } else if (
      existing.lastConfirmedBidderId &&
      existing.lastConfirmedBidderAlias &&
      existing.lastConfirmedBid !== null
    ) {
      winnerId = existing.lastConfirmedBidderId;
      winnerAlias = existing.lastConfirmedBidderAlias;
      winningBid = existing.lastConfirmedBid;
    } else {
      throw AuthError.validation(
        "No hay puja que vender: nadie tiene paleta y no hay oferta firme previa.",
      );
    }

    // Validación de saldo al momento del cierre. El jugador pudo haber
    // transferido sus fichas después de pujar; si ya no alcanza, el
    // anunciador necesita reconciliar (reset + nueva puja, o algún otro
    // acuerdo fuera del sistema).
    const wallet = await this.wallets.findByCasinoAndPlayer(
      input.casinoId,
      winnerId,
    );
    const balance = wallet?.balance ?? 0;
    if (balance < winningBid) {
      throw AuthError.validation(
        `El ganador (${winnerAlias}) ya no tiene saldo suficiente: $${balance} vs $${winningBid} ofertados.`,
      );
    }

    // Cobro idempotente. El batchId incluye round para que re-ejecuciones
    // del mismo sold no dupliquen, pero un nuevo round (reset + vendido)
    // sí genere una tx distinta.
    const batchId = `auction:${existing.id}:${existing.roundNumber}`;
    const outcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        playerId: winnerId,
        amount: -winningBid, // delta negativo = débito
        batchId,
        actorId: input.actorId,
        note: `Subasta: adjudicado a ${winnerAlias}`,
        kind: "auction_purchase",
      },
    );

    if (outcome.status === "failed") {
      throw AuthError.validation(
        `No se pudo cobrar al ganador: ${outcome.reason}`,
      );
    }

    return this.auctions.upsertByCasino({
      casinoId: input.casinoId,
      currentBid: 0,
      currentBidderId: null,
      currentBidderAlias: null,
      lastConfirmedBid: null,
      lastConfirmedBidderId: null,
      lastConfirmedBidderAlias: null,
      lastSoldBid: winningBid,
      lastSoldBidderId: winnerId,
      lastSoldBidderAlias: winnerAlias,
      roundNumber: existing.roundNumber + 1,
    });
  }
}
