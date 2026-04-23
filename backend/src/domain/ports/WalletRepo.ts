import type { Wallet } from "../entities/Wallet.js";

export interface WalletRepo {
  findByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
  ): Promise<Wallet | null>;
  /** Crea un wallet nuevo con balance=0, active=true, exists=true. */
  createForCasinoAndPlayer(
    casinoId: string,
    playerId: string,
  ): Promise<Wallet>;
  /**
   * Incrementa atómicamente el balance via Parse `.increment()` (Mongo `$inc`).
   * Devuelve el balance resultante post-save para poder snapshottearlo en la
   * fila de WalletTransaction.
   */
  incrementBalance(walletId: string, delta: number): Promise<number>;
  findByCasino(casinoId: string): Promise<Wallet[]>;
  findByPlayer(playerId: string): Promise<Wallet[]>;
}
