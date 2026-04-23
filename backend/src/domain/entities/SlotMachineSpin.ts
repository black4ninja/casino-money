export type SlotMachineSpinProps = {
  id: string;
  casinoId: string;
  playerId: string;
  walletId: string;
  /** Apuesta en MXN enteros. Debe ser uno de BET_LEVELS (100 | 200 | 500). */
  bet: number;
  /** Tres símbolos de la fila central, ids del slotConfig (ej. ["singleton","zero","adapter"]). */
  result: readonly [string, string, string];
  /** Multiplicador aplicado: 0 (pierde), 1 (reembolso), 2, 3, o 5 (jackpot). */
  multiplier: number;
  /** Payout bruto = bet * multiplier. */
  payout: number;
  /** Ganancia/pérdida neta desde la perspectiva del jugador (payout - bet). */
  net: number;
  /** Mismo batchId que las dos WalletTransaction ligadas (bet y payout). */
  batchId: string;
  createdAt: Date;
};

/**
 * Registro histórico de una tirada de la tragamonedas. Append-only — no hay
 * flags active/exists, no se archiva. El balance del jugador se deriva del
 * ledger de WalletTransaction, no de sumar estos spins.
 */
export class SlotMachineSpin {
  readonly id: string;
  readonly casinoId: string;
  readonly playerId: string;
  readonly walletId: string;
  readonly bet: number;
  readonly result: readonly [string, string, string];
  readonly multiplier: number;
  readonly payout: number;
  readonly net: number;
  readonly batchId: string;
  readonly createdAt: Date;

  constructor(props: SlotMachineSpinProps) {
    this.id = props.id;
    this.casinoId = props.casinoId;
    this.playerId = props.playerId;
    this.walletId = props.walletId;
    this.bet = props.bet;
    this.result = props.result;
    this.multiplier = props.multiplier;
    this.payout = props.payout;
    this.net = props.net;
    this.batchId = props.batchId;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      casinoId: this.casinoId,
      playerId: this.playerId,
      walletId: this.walletId,
      bet: this.bet,
      result: [...this.result] as [string, string, string],
      multiplier: this.multiplier,
      payout: this.payout,
      net: this.net,
      batchId: this.batchId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
