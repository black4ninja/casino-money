export type WalletProps = {
  id: string;
  casinoId: string;
  userId: string;
  /** MXN enteros. Solo debe mutarse atómicamente vía `.increment()`. */
  balance: number;
  active: boolean;
  exists: boolean;
  createdAt: Date;
};

/**
 * Monedero por (casino, usuario). Se crea perezosamente al primer flujo de
 * dinero — no hay backfill ni creación al asignar jugador a casino.
 *
 * El `userId` apunta a un `AppUser` de cualquier rol:
 *   - `player`: wallet tradicional del estudiante con su saldo para jugar.
 *   - `dealer`: wallet personal del tallador, alimentado por la comisión
 *     que recibe al cobrar fichas a los jugadores. Le permite participar en
 *     subastas con su dinero acumulado.
 *
 * Si un jugador cambia de departamento y sale del roster derivado, el
 * monedero persiste como registro histórico con su saldo intacto.
 *
 * Sigue el patrón de lifecycle estándar del proyecto:
 *   active=false → congelado (no admite créditos/débitos). Reversible.
 *   exists=false → soft-deleted, oculto. Implica active=false.
 */
export class Wallet {
  readonly id: string;
  readonly casinoId: string;
  readonly userId: string;
  readonly balance: number;
  readonly active: boolean;
  readonly exists: boolean;
  readonly createdAt: Date;

  constructor(props: WalletProps) {
    this.id = props.id;
    this.casinoId = props.casinoId;
    this.userId = props.userId;
    this.balance = props.balance;
    this.active = props.active;
    this.exists = props.exists;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      casinoId: this.casinoId,
      userId: this.userId,
      balance: this.balance,
      active: this.active,
      exists: this.exists,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
