import type { GameType } from "./GameType.js";

export type MesaProps = {
  id: string;
  casinoId: string;
  gameType: GameType;
  /** AppUser.id of the assigned tallador, or null if none yet. */
  talladorId: string | null;
  active: boolean;
  exists: boolean;
  createdAt: Date;
};

/**
 * A mesa is a playing station inside a casino event. Carries its game type
 * plus (optionally) the assigned tallador. The juego runtime hookup comes
 * later. Follows the project lifecycle convention:
 *   active=false → archived, cannot be operated on,
 *   exists=false → soft-deleted, hidden from every listing.
 *
 * `casinoId` and `talladorId` are strings at this layer; the Parse repo
 * translates them to pointers at the persistence boundary (see
 * memory/project_parse_pointers_for_relations.md).
 */
export class Mesa {
  readonly id: string;
  readonly casinoId: string;
  readonly gameType: GameType;
  readonly talladorId: string | null;
  readonly active: boolean;
  readonly exists: boolean;
  readonly createdAt: Date;

  constructor(props: MesaProps) {
    this.id = props.id;
    this.casinoId = props.casinoId;
    this.gameType = props.gameType;
    this.talladorId = props.talladorId;
    this.active = props.active;
    this.exists = props.exists;
    this.createdAt = props.createdAt;
  }

  toPublic() {
    return {
      id: this.id,
      casinoId: this.casinoId,
      gameType: this.gameType,
      talladorId: this.talladorId,
      active: this.active,
      exists: this.exists,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
