export type WalletProps = {
  id: string;
  casinoId: string;
  playerId: string;
  /** MXN enteros. Solo debe mutarse atómicamente vía `.increment()`. */
  balance: number;
  active: boolean;
  exists: boolean;
  createdAt: Date;
};

/**
 * Monedero por (casino, jugador). Se crea perezosamente al primer flujo de
 * dinero — no hay backfill ni creación al asignar jugador a casino. Si un
 * jugador cambia de departamento y sale del roster derivado, el monedero
 * persiste como registro histórico con su saldo intacto.
 *
 * Sigue el patrón de lifecycle estándar del proyecto:
 *   active=false → congelado (no admite créditos/débitos). Reversible.
 *   exists=false → soft-deleted, oculto. Implica active=false.
 */
export class Wallet {
  readonly id: string;
  readonly casinoId: string;
  readonly playerId: string;
  readonly balance: number;
  readonly active: boolean;
  readonly exists: boolean;
  readonly createdAt: Date;

  constructor(props: WalletProps) {
    this.id = props.id;
    this.casinoId = props.casinoId;
    this.playerId = props.playerId;
    this.balance = props.balance;
    this.active = props.active;
    this.exists = props.exists;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      casinoId: this.casinoId,
      playerId: this.playerId,
      balance: this.balance,
      active: this.active,
      exists: this.exists,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
