export type CasinoProps = {
  id: string;
  /** Human-readable name of the casino event ("Casino de Viernes", etc.). */
  name: string;
  /** When the event takes place. Stored as a Date; the day is what matters. */
  date: Date;
  /**
   * Player department names (values of AppUser.departamento) that belong to
   * this casino. Membership is dynamic: any active player whose `departamento`
   * is in this list plays at this casino — no separate assignment table.
   */
  departamentos: string[];
  /**
   * Dealer ids (AppUser.id, role=dealer) assigned to this casino. A mesa can
   * only accept a tallador from this list once it's non-empty; an empty list
   * means "no restriction yet" so older casinos keep working.
   */
  dealerIds: string[];
  active: boolean;
  exists: boolean;
  createdAt: Date;
};

/**
 * A "casino" is an event (a night of play) scheduled by a master. It carries:
 *   - event header (name + date),
 *   - the player pool via `departamentos` (dynamic rule against AppUser.departamento),
 *   - the dealer pool via `dealerIds` (explicit assignment of dealers),
 * plus the standard lifecycle flags.
 *
 * Follows the project-wide lifecycle convention (see
 * memory/project_entity_lifecycle_pattern.md):
 *   active=false → archived, cannot be operated on (nobody can assign mesas,
 *                  run the event, etc.). Reversible.
 *   exists=false → soft-deleted, hidden from every listing. Implies active=false.
 */
export class Casino {
  readonly id: string;
  readonly name: string;
  readonly date: Date;
  readonly departamentos: string[];
  readonly dealerIds: string[];
  readonly active: boolean;
  readonly exists: boolean;
  readonly createdAt: Date;

  constructor(props: CasinoProps) {
    this.id = props.id;
    this.name = props.name;
    this.date = props.date;
    this.departamentos = props.departamentos;
    this.dealerIds = props.dealerIds;
    this.active = props.active;
    this.exists = props.exists;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      date: this.date.toISOString(),
      departamentos: this.departamentos,
      dealerIds: this.dealerIds,
      active: this.active,
      exists: this.exists,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
