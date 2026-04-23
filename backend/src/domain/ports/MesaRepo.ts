import type { Mesa } from "../entities/Mesa.js";
import type { GameType } from "../entities/GameType.js";

export type CreateMesaInput = {
  casinoId: string;
  gameType: GameType;
};

export type UpdateMesaInput = {
  gameType?: GameType;
  /**
   * Assignment operations:
   *   undefined → leave as-is
   *   string    → assign this tallador id
   *   null      → unassign
   */
  talladorId?: string | null;
};

export interface MesaRepo {
  findById(id: string): Promise<Mesa | null>;
  findByIdIncludingDeleted(id: string): Promise<Mesa | null>;
  /** Mesas of a casino — includes archived, excludes deleted, oldest first. */
  listByCasino(casinoId: string): Promise<Mesa[]>;
  /** Mesas assigned to a specific tallador — same include/exclude rules. */
  listByTallador(userId: string): Promise<Mesa[]>;
  create(input: CreateMesaInput): Promise<Mesa>;
  update(id: string, patch: UpdateMesaInput): Promise<Mesa>;
  setActive(id: string, active: boolean): Promise<Mesa>;
  softDelete(id: string): Promise<void>;
}
