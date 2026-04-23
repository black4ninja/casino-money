export type CasinoProps = {
  id: string;
  /** Human-readable name of the casino event ("Casino de Viernes", etc.). */
  name: string;
  /** When the event takes place. Stored as a Date; the day is what matters. */
  date: Date;
  active: boolean;
  exists: boolean;
  createdAt: Date;
};

/**
 * A "casino" is an event (a night of play) scheduled by a master. Mesas /
 * juegos / talladores will later be assigned to a Casino — that wiring is
 * deliberately out of scope here; this entity only carries the event header
 * (name + date) plus the standard lifecycle flags.
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
  readonly active: boolean;
  readonly exists: boolean;
  readonly createdAt: Date;

  constructor(props: CasinoProps) {
    this.id = props.id;
    this.name = props.name;
    this.date = props.date;
    this.active = props.active;
    this.exists = props.exists;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      date: this.date.toISOString(),
      active: this.active,
      exists: this.exists,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
