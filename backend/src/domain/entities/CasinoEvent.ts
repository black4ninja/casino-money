/**
 * Catálogo fijo de tipos de evento soportados hoy. El multiplicador es
 * aplicado por el use-case que ejecuta la transacción — la entidad sólo
 * declara qué tipo es.
 *
 *   WIN_DOUBLE     → depósitos del dealer/admin al jugador se duplican.
 *   LOSS_DOUBLE    → cobros del dealer/admin al jugador se duplican.
 *   SLOT_DOUBLE    → premios de la tragamonedas (`slot_payout`) se duplican.
 *   CARRERA_DOUBLE → pagos ganadores de la Carrera de Patrones
 *                    (`carrera_payout`) se duplican.
 *   GREEDY_DOUBLE  → el reward por completar los 100 clicks del banner
 *                    Greedy se entrega al doble (2 fichas en vez de 1).
 */
export type CasinoEventType =
  | "WIN_DOUBLE"
  | "LOSS_DOUBLE"
  | "SLOT_DOUBLE"
  | "CARRERA_DOUBLE"
  | "GREEDY_DOUBLE";

const CASINO_EVENT_TYPES: CasinoEventType[] = [
  "WIN_DOUBLE",
  "LOSS_DOUBLE",
  "SLOT_DOUBLE",
  "CARRERA_DOUBLE",
  "GREEDY_DOUBLE",
];

export function isCasinoEventType(v: unknown): v is CasinoEventType {
  return (
    typeof v === "string" &&
    (CASINO_EVENT_TYPES as string[]).includes(v)
  );
}

export type CasinoEventProps = {
  id: string;
  casinoId: string;
  /** Nombre visible para el jugador ("Noche de la suerte", etc.). */
  name: string;
  type: CasinoEventType;
  /** true = en curso. Sólo uno del mismo type puede estar activo a la vez. */
  active: boolean;
  exists: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Evento de casino: una regla temporal que multiplica el monto de las
 * transacciones directas dealer/admin ↔ jugador mientras esté activa.
 *
 * Sigue el patrón de lifecycle del proyecto (memory/project_entity_lifecycle_pattern):
 *   active=false → archivado, sin efecto en transacciones. Reversible.
 *   exists=false → borrado lógico, oculto de todo listado. Implica active=false.
 */
export class CasinoEvent {
  readonly id: string;
  readonly casinoId: string;
  readonly name: string;
  readonly type: CasinoEventType;
  readonly active: boolean;
  readonly exists: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: CasinoEventProps) {
    this.id = props.id;
    this.casinoId = props.casinoId;
    this.name = props.name;
    this.type = props.type;
    this.active = props.active;
    this.exists = props.exists;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  toPublic() {
    return {
      id: this.id,
      casinoId: this.casinoId,
      name: this.name,
      type: this.type,
      active: this.active,
      exists: this.exists,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
