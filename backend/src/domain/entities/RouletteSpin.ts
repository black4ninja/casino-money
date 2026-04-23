export type RouletteSpinProps = {
  id: string;
  mesaId: string;
  talladorId: string;
  /** Stable pattern slug from the frontend PATTERNS catalog (e.g. "observer"). */
  patternId: string;
  createdAt: Date;
};

/**
 * Historical record of one spin of the roulette. Written on every landing
 * and read back whenever the UI needs "the last result" (score view, later
 * player-facing boards, exports). Events, not admin entities — skipped
 * `active`/`exists` on purpose (they don't get archived or soft-deleted).
 */
export class RouletteSpin {
  readonly id: string;
  readonly mesaId: string;
  readonly talladorId: string;
  readonly patternId: string;
  readonly createdAt: Date;

  constructor(props: RouletteSpinProps) {
    this.id = props.id;
    this.mesaId = props.mesaId;
    this.talladorId = props.talladorId;
    this.patternId = props.patternId;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      mesaId: this.mesaId,
      talladorId: this.talladorId,
      patternId: this.patternId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
