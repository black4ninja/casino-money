import type { BetKind, PatternId } from "./patternRace/patternCatalog.js";

export type PatternRaceBetStatus =
  /** Apuesta registrada, carrera aún no termina. */
  | "open"
  /** Carrera terminó y la apuesta perdió. */
  | "lost"
  /** Carrera terminó y la apuesta ganó; payout acreditado al wallet. */
  | "won";

export const PATTERN_RACE_BET_STATUSES: readonly PatternRaceBetStatus[] = [
  "open",
  "lost",
  "won",
] as const;

export function isPatternRaceBetStatus(value: unknown): value is PatternRaceBetStatus {
  return (
    typeof value === "string" &&
    (PATTERN_RACE_BET_STATUSES as readonly string[]).includes(value)
  );
}

export type PatternRaceBetProps = {
  id: string;
  casinoId: string;
  playerId: string;
  walletId: string;
  /** Ciclo de carrera al que aplica; ver computeRace.cycleIndexForTime. */
  cycleIndex: number;
  /** Patrón elegido por el jugador. */
  patternId: PatternId;
  /** Tipo de apuesta: ganador o podio (top 3). */
  kind: BetKind;
  /** Apuesta en MXN enteros (ver CARRERA_BET_LEVELS). */
  amount: number;
  status: PatternRaceBetStatus;
  /** Payout bruto cuando status=won; 0 si lost/open. */
  payout: number;
  /** batchId de la apuesta (usado para el ledger y idempotencia del débito). */
  betBatchId: string;
  /** batchId del payout cuando ganó (único por apuesta); null si no ganó. */
  payoutBatchId: string | null;
  createdAt: Date;
  settledAt: Date | null;
};

/**
 * Apuesta individual a una carrera. Append-like: una vez `won` o `lost` no
 * muta de nuevo. El campo payout queda fijo al momento de liquidar.
 */
export class PatternRaceBet {
  readonly id: string;
  readonly casinoId: string;
  readonly playerId: string;
  readonly walletId: string;
  readonly cycleIndex: number;
  readonly patternId: PatternId;
  readonly kind: BetKind;
  readonly amount: number;
  readonly status: PatternRaceBetStatus;
  readonly payout: number;
  readonly betBatchId: string;
  readonly payoutBatchId: string | null;
  readonly createdAt: Date;
  readonly settledAt: Date | null;

  constructor(props: PatternRaceBetProps) {
    this.id = props.id;
    this.casinoId = props.casinoId;
    this.playerId = props.playerId;
    this.walletId = props.walletId;
    this.cycleIndex = props.cycleIndex;
    this.patternId = props.patternId;
    this.kind = props.kind;
    this.amount = props.amount;
    this.status = props.status;
    this.payout = props.payout;
    this.betBatchId = props.betBatchId;
    this.payoutBatchId = props.payoutBatchId;
    this.createdAt = props.createdAt;
    this.settledAt = props.settledAt;
  }

  toPublic() {
    return {
      id: this.id,
      casinoId: this.casinoId,
      playerId: this.playerId,
      walletId: this.walletId,
      cycleIndex: this.cycleIndex,
      patternId: this.patternId,
      kind: this.kind,
      amount: this.amount,
      status: this.status,
      payout: this.payout,
      betBatchId: this.betBatchId,
      payoutBatchId: this.payoutBatchId,
      createdAt: this.createdAt.toISOString(),
      settledAt: this.settledAt ? this.settledAt.toISOString() : null,
    };
  }
}
