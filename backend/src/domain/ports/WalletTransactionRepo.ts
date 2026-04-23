import type { WalletTransaction } from "../entities/WalletTransaction.js";
import type { TransactionKind } from "../entities/TransactionKind.js";

export type CreatePendingWalletTransactionInput = {
  walletId: string;
  casinoId: string;
  playerId: string;
  kind: TransactionKind;
  delta: number;
  idempotencyKey: string;
  batchId: string;
  actorId: string;
  note: string | null;
};

export interface WalletTransactionRepo {
  /** Null si no existe. Crucial para idempotencia del bulk-credit. */
  findByIdempotencyKey(key: string): Promise<WalletTransaction | null>;
  /** Crea la fila con status="pending" y balanceAfter=null. */
  createPending(
    input: CreatePendingWalletTransactionInput,
  ): Promise<WalletTransaction>;
  markCommitted(
    txId: string,
    balanceAfter: number,
  ): Promise<WalletTransaction>;
  /**
   * Se usa cuando al reintentar encontramos una tx pending: la marcamos como
   * recovered con el balance actual sin re-incrementar (preserva el invariante
   * "una tx ⇒ a lo más un increment aplicado").
   */
  markRecovered(
    txId: string,
    balanceAfter: number,
  ): Promise<WalletTransaction>;
  markFailed(txId: string, reason: string): Promise<WalletTransaction>;
  listByBatch(batchId: string): Promise<WalletTransaction[]>;
  listByWallet(walletId: string, limit?: number): Promise<WalletTransaction[]>;
  /** Historial de movimientos de un jugador en un casino específico. */
  listByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
    limit?: number,
  ): Promise<WalletTransaction[]>;
}
