import type { SlotMachineSpin } from "../entities/SlotMachineSpin.js";

export type CreateSlotMachineSpinInput = {
  casinoId: string;
  playerId: string;
  walletId: string;
  bet: number;
  result: readonly [string, string, string];
  multiplier: number;
  payout: number;
  net: number;
  batchId: string;
};

export interface SlotMachineSpinRepo {
  create(input: CreateSlotMachineSpinInput): Promise<SlotMachineSpin>;
  /** Usado para idempotencia: si ya hay un spin con este batchId, re-devolverlo en lugar de rodar de nuevo. */
  findByBatchId(batchId: string): Promise<SlotMachineSpin | null>;
  /** Historial del jugador en un casino, descendente por fecha. */
  listByCasinoAndPlayer(
    casinoId: string,
    playerId: string,
    limit?: number,
  ): Promise<SlotMachineSpin[]>;
}
