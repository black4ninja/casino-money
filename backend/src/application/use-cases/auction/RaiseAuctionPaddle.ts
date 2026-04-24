import type { AuctionRepo } from "../../../domain/ports/AuctionRepo.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { AppUserRepo } from "../../../domain/ports/AppUserRepo.js";
import type { WalletRepo } from "../../../domain/ports/WalletRepo.js";
import type { Auction } from "../../../domain/entities/Auction.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

export type RaiseAuctionPaddleInput = {
  casinoId: string;
  playerId: string;
  /**
   * Monto ofertado. Debe ser múltiplo de 100, ≥ currentBid (o ≥ piso si
   * aún no hay pujador), y > currentBid si otro jugador tiene la paleta
   * en alto (regla estándar de subasta: solo puedes entrar mejorando
   * la oferta actual).
   */
  amount: number;
};

const BID_DENOMINATION = 100;
const MAX_BID = 100_000_000;

/**
 * El jugador levanta su paleta ofertando `amount`. El monto se convierte
 * en el nuevo `currentBid` y el jugador queda como pujador visible. No
 * mueve wallet: la transacción monetaria se resuelve al cerrar la puja.
 *
 * Reglas:
 *   - casino en modo subasta activo,
 *   - jugador activo en el roster (departamento),
 *   - ya hay un piso (`currentBid > 0`) — el anunciador abrió la ronda,
 *   - `amount` múltiplo de $100, dentro de [currentBid, MAX_BID],
 *   - si hay otro pujador, `amount > currentBid` (estás mejorando),
 *   - saldo del jugador en el casino ≥ `amount` (no puede pujar lo que
 *     no puede pagar — el admin lo cobrará al cerrar).
 */
export class RaiseAuctionPaddleUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly auctions: AuctionRepo,
    private readonly wallets: WalletRepo,
  ) {}

  async execute(input: RaiseAuctionPaddleInput): Promise<Auction> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.subastaActive) {
      throw AuthError.validation(
        "La subasta no está activa en este casino.",
      );
    }

    const player = await this.users.findById(input.playerId);
    if (!player) throw AuthError.tokenInvalid();
    if (player.role !== "player") {
      throw AuthError.validation("Solo los jugadores pueden pujar.");
    }
    if (!player.active) throw AuthError.inactiveAccount();
    if (
      player.departamento === null ||
      !casino.departamentos.includes(player.departamento)
    ) {
      throw AuthError.validation(
        "No estás registrado en el roster de este casino.",
      );
    }

    const existing = await this.auctions.findByCasino(input.casinoId);
    if (!existing || existing.currentBid <= 0) {
      throw AuthError.validation(
        "La puja aún no tiene valor inicial. Espera al anunciador.",
      );
    }

    // Validación del monto ofertado.
    if (!Number.isFinite(input.amount) || !Number.isInteger(input.amount)) {
      throw AuthError.validation("El monto debe ser un entero.");
    }
    if (input.amount % BID_DENOMINATION !== 0) {
      throw AuthError.validation(
        `El monto debe ser múltiplo de $${BID_DENOMINATION}.`,
      );
    }
    if (input.amount > MAX_BID) {
      throw AuthError.validation(
        `El monto excede el máximo permitido ($${MAX_BID}).`,
      );
    }
    if (input.amount < existing.currentBid) {
      throw AuthError.validation(
        `Tu oferta debe ser al menos $${existing.currentBid} (valor actual).`,
      );
    }
    // Si ya hay otro pujador, tienes que superar su oferta. Puedes re-pujar
    // tu propio monto (sin efecto, es ruido, pero no lo bloqueamos — el
    // `amount === currentBid` con mismo bidder simplemente reafirma).
    if (
      existing.currentBidderId &&
      existing.currentBidderId !== player.id &&
      input.amount <= existing.currentBid
    ) {
      throw AuthError.validation(
        `Ya hay una oferta de $${existing.currentBid}. Debes superarla para entrar.`,
      );
    }

    // Validación de saldo contra el MONTO OFERTADO (no el current), porque
    // si ganas vas a pagar lo que ofreciste, no el precio anterior.
    const wallet = await this.wallets.findByCasinoAndPlayer(
      input.casinoId,
      input.playerId,
    );
    const balance = wallet?.balance ?? 0;
    if (balance < input.amount) {
      throw AuthError.validation(
        `Saldo insuficiente: tienes $${balance}, ofreciste $${input.amount}.`,
      );
    }

    // Alias del pujador denormalizado en el registro — evita al display
    // resolver usuarios y permite servir la vista pública sin auth.
    const alias = player.alias || player.fullName || player.matricula;

    return this.auctions.upsertByCasino({
      casinoId: input.casinoId,
      // La oferta del jugador se convierte en el nuevo precio vigente —
      // así el siguiente tendrá que superarla.
      currentBid: input.amount,
      currentBidderId: player.id,
      currentBidderAlias: alias,
      lastConfirmedBid: existing.lastConfirmedBid,
      lastConfirmedBidderId: existing.lastConfirmedBidderId,
      lastConfirmedBidderAlias: existing.lastConfirmedBidderAlias,
      lastSoldBid: existing.lastSoldBid,
      lastSoldBidderId: existing.lastSoldBidderId,
      lastSoldBidderAlias: existing.lastSoldBidderAlias,
      roundNumber: existing.roundNumber,
    });
  }
}
