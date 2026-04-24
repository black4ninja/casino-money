import type { CasinoEvent, CasinoEventType } from "../entities/CasinoEvent.js";

export type CreateCasinoEventInput = {
  casinoId: string;
  name: string;
  type: CasinoEventType;
};

export type UpdateCasinoEventInput = {
  name?: string;
};

export interface CasinoEventRepo {
  findById(id: string): Promise<CasinoEvent | null>;
  findByIdIncludingDeleted(id: string): Promise<CasinoEvent | null>;
  /** Admin listing — incluye archivados (active=false), excluye eliminados. */
  listByCasino(casinoId: string): Promise<CasinoEvent[]>;
  /**
   * Sólo los que están en curso — usado por el path de transacciones y por
   * el banner del jugador. Excluye archivados y eliminados.
   */
  listActiveByCasino(casinoId: string): Promise<CasinoEvent[]>;
  create(input: CreateCasinoEventInput): Promise<CasinoEvent>;
  update(id: string, patch: UpdateCasinoEventInput): Promise<CasinoEvent>;
  /** Archivar / reactivar — flipa active. */
  setActive(id: string, active: boolean): Promise<CasinoEvent>;
  /** Borrado lógico — active=false AND exists=false. Irreversible desde UI. */
  softDelete(id: string): Promise<void>;
}
