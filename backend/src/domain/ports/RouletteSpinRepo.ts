import type { RouletteSpin } from "../entities/RouletteSpin.js";

export type CreateRouletteSpinInput = {
  mesaId: string;
  talladorId: string;
  patternId: string;
};

export interface RouletteSpinRepo {
  create(input: CreateRouletteSpinInput): Promise<RouletteSpin>;
  /** Most recent spin on a mesa, null if there are none. */
  findLastByMesa(mesaId: string): Promise<RouletteSpin | null>;
}
