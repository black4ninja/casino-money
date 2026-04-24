export type AuctionProps = {
  id: string;
  casinoId: string;
  /** Valor actual de la puja en MXN. 0 hasta que el anunciador lo setee. */
  currentBid: number;
  /**
   * Jugador que levantó la paleta más reciente. null cuando nadie ha
   * pujado aún en esta ronda. Solo una persona es "el interesado" a la
   * vez — la última paleta gana visibilidad.
   */
  currentBidderId: string | null;
  /**
   * Alias denormalizado del pujador actual para pintarlo en el display
   * público sin necesidad de resolver users. Null si nadie ha pujado.
   */
  currentBidderAlias: string | null;
  /**
   * Snapshot de la última oferta confirmada antes del último cambio de
   * precio. Cuando el anunciador sube el piso y nadie acepta el nuevo
   * valor, ésta queda como la oferta "en firme" hasta que alguien puje al
   * nuevo precio o se cierre con Vendido. Se limpia en reset y en sell.
   */
  lastConfirmedBid: number | null;
  lastConfirmedBidderId: string | null;
  lastConfirmedBidderAlias: string | null;
  /**
   * Último artículo vendido: persiste por ronda para que el display pueda
   * mostrar "VENDIDO a X por $Y" mientras se prepara el siguiente objeto.
   * Se limpia en el próximo Vendido o setInitial de la siguiente ronda.
   */
  lastSoldBid: number | null;
  lastSoldBidderId: string | null;
  lastSoldBidderAlias: string | null;
  /**
   * Contador de rondas. Cada reset/vendido incrementa este número; el
   * frontend lo usa para detectar que el estado se limpió (útil en el
   * display para descartar pujadores viejos si no actualizó a tiempo).
   */
  roundNumber: number;
  /** Última modificación (update de valor o de pujador). */
  updatedAt: Date;
  createdAt: Date;
};

/**
 * Subasta "viva" en un casino. Una sola por casino en todo momento
 * (single-record upsert). Persiste valor actual + quién levantó la
 * paleta + número de ronda. No guarda historial: el anunciador conduce
 * la subasta en vivo, lo que importa es el estado presente visible en
 * el display global.
 */
export class Auction {
  readonly id: string;
  readonly casinoId: string;
  readonly currentBid: number;
  readonly currentBidderId: string | null;
  readonly currentBidderAlias: string | null;
  readonly lastConfirmedBid: number | null;
  readonly lastConfirmedBidderId: string | null;
  readonly lastConfirmedBidderAlias: string | null;
  readonly lastSoldBid: number | null;
  readonly lastSoldBidderId: string | null;
  readonly lastSoldBidderAlias: string | null;
  readonly roundNumber: number;
  readonly updatedAt: Date;
  readonly createdAt: Date;

  constructor(props: AuctionProps) {
    this.id = props.id;
    this.casinoId = props.casinoId;
    this.currentBid = props.currentBid;
    this.currentBidderId = props.currentBidderId;
    this.currentBidderAlias = props.currentBidderAlias;
    this.lastConfirmedBid = props.lastConfirmedBid;
    this.lastConfirmedBidderId = props.lastConfirmedBidderId;
    this.lastConfirmedBidderAlias = props.lastConfirmedBidderAlias;
    this.lastSoldBid = props.lastSoldBid;
    this.lastSoldBidderId = props.lastSoldBidderId;
    this.lastSoldBidderAlias = props.lastSoldBidderAlias;
    this.roundNumber = props.roundNumber;
    this.updatedAt = props.updatedAt;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      casinoId: this.casinoId,
      currentBid: this.currentBid,
      currentBidderId: this.currentBidderId,
      currentBidderAlias: this.currentBidderAlias,
      lastConfirmedBid: this.lastConfirmedBid,
      lastConfirmedBidderId: this.lastConfirmedBidderId,
      lastConfirmedBidderAlias: this.lastConfirmedBidderAlias,
      lastSoldBid: this.lastSoldBid,
      lastSoldBidderId: this.lastSoldBidderId,
      lastSoldBidderAlias: this.lastSoldBidderAlias,
      roundNumber: this.roundNumber,
      updatedAt: this.updatedAt.toISOString(),
      createdAt: this.createdAt.toISOString(),
    };
  }
}
