import type { Role } from "./Role.js";
import { roleSatisfies } from "./Role.js";

export type AppUserProps = {
  id: string;
  matricula: string;
  role: Role;
  fullName: string | null;
  /**
   * Player-only field — department / program / organizational unit the
   * student belongs to (e.g. "ITC", "IMT"). Always null for staff accounts
   * (master/dealer). Populated via single-create or CSV bulk import.
   */
  departamento: string | null;
  /**
   * Player-chosen display name used inside the game (leaderboards, chip
   * transfers, etc). Independent from `fullName` — that's the school-of-
   * record identity and is not edited by the player. `alias` is optional;
   * when null the UI falls back to fullName or matricula.
   */
  alias: string | null;
  active: boolean;
  exists: boolean;
  createdAt: Date;
};

/**
 * Lifecycle flags (project convention — apply to every admin-managed entity):
 *   active = false  → archived. Entity is still in the system but cannot
 *                     perform any action (login denied, operations refused).
 *                     Reversible via unarchive.
 *   exists = false  → soft-deleted. Entity is hidden from every listing and
 *                     cannot be looked up. `active` is forced to false too
 *                     so no code path can act on it. Irreversible from UI.
 *
 * Invariants:
 *   exists = false implies active = false (delete takes precedence over archive).
 */
export class AppUser {
  readonly id: string;
  readonly matricula: string;
  readonly role: Role;
  readonly fullName: string | null;
  readonly departamento: string | null;
  readonly alias: string | null;
  readonly active: boolean;
  readonly exists: boolean;
  readonly createdAt: Date;

  constructor(props: AppUserProps) {
    this.id = props.id;
    this.matricula = props.matricula;
    this.role = props.role;
    this.fullName = props.fullName;
    this.departamento = props.departamento;
    this.alias = props.alias;
    this.active = props.active;
    this.exists = props.exists;
    this.createdAt = props.createdAt;
  }

  hasRole(required: Role): boolean {
    return roleSatisfies(this.role, required);
  }

  toPublic() {
    return {
      id: this.id,
      matricula: this.matricula,
      role: this.role,
      fullName: this.fullName,
      departamento: this.departamento,
      alias: this.alias,
      active: this.active,
      exists: this.exists,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
