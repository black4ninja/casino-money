import type {
  TransactionKind,
  TransactionStatus,
} from "./TransactionKind.js";

export type WalletTransactionProps = {
  id: string;
  walletId: string;
  casinoId: string;
  userId: string;
  kind: TransactionKind;
  /** Firmado. Positivo = crédito, negativo = débito. */
  delta: number;
  /** Saldo después de aplicar el delta. null mientras status="pending". */
  balanceAfter: number | null;
  /** Único lógico por fila. Formato para bulk-credit: `${batchId}:${userId}`. */
  idempotencyKey: string;
  /** Agrupa todas las tx de una operación masiva. */
  batchId: string;
  /** AppUser.id del staff que disparó la operación. */
  actorId: string;
  note: string | null;
  status: TransactionStatus;
  createdAt: Date;
};

/**
 * Log inmutable (append-only) de movimientos de dinero. El lifecycle vive
 * en `status`:
 *   pending              → tx creada; increment aún no confirmado.
 *   committed            → increment aplicado y balanceAfter registrado.
 *   committed_recovered  → detectada una tx pending huérfana al reintentar;
 *                          se marca sin re-incrementar para no duplicar.
 *   failed               → el increment tiró error; balance no cambió.
 *
 * Invariante: status ∈ {committed, committed_recovered} ⇒ balanceAfter !== null.
 */
export class WalletTransaction {
  readonly id: string;
  readonly walletId: string;
  readonly casinoId: string;
  readonly userId: string;
  readonly kind: TransactionKind;
  readonly delta: number;
  readonly balanceAfter: number | null;
  readonly idempotencyKey: string;
  readonly batchId: string;
  readonly actorId: string;
  readonly note: string | null;
  readonly status: TransactionStatus;
  readonly createdAt: Date;

  constructor(props: WalletTransactionProps) {
    this.id = props.id;
    this.walletId = props.walletId;
    this.casinoId = props.casinoId;
    this.userId = props.userId;
    this.kind = props.kind;
    this.delta = props.delta;
    this.balanceAfter = props.balanceAfter;
    this.idempotencyKey = props.idempotencyKey;
    this.batchId = props.batchId;
    this.actorId = props.actorId;
    this.note = props.note;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      walletId: this.walletId,
      casinoId: this.casinoId,
      userId: this.userId,
      kind: this.kind,
      delta: this.delta,
      balanceAfter: this.balanceAfter,
      idempotencyKey: this.idempotencyKey,
      batchId: this.batchId,
      actorId: this.actorId,
      note: this.note,
      status: this.status,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
