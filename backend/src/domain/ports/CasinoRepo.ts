import type { Casino } from "../entities/Casino.js";

export type CreateCasinoInput = {
  name: string;
  date: Date;
};

export type UpdateCasinoInput = {
  name?: string;
  date?: Date;
};

export interface CasinoRepo {
  findById(id: string): Promise<Casino | null>;
  findByIdIncludingDeleted(id: string): Promise<Casino | null>;
  /** Admin listing — includes archived (active=false), excludes deleted. */
  list(): Promise<Casino[]>;
  create(input: CreateCasinoInput): Promise<Casino>;
  update(id: string, patch: UpdateCasinoInput): Promise<Casino>;
  /** Archive / unarchive — flips `active`. */
  setActive(id: string, active: boolean): Promise<Casino>;
  /** Logical delete — sets exists=false AND active=false. Irreversible from UI. */
  softDelete(id: string): Promise<void>;
}
