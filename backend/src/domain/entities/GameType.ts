/**
 * The catalog of games that a mesa can host. Adding a new game means
 * extending this list and the mirror in frontend/src/domain/games.ts —
 * both must stay in sync on the ids (the labels live only on the frontend).
 *
 * ids are slug-style (stable across rebrands), labels live in the UI.
 */
export const GAME_TYPES = [
  "ruleta",
  "la_banca_sabe",
  "poker_holdem",
  "blackjack",
  "showdown",
  "cubilete",
  "tira_o_paga",
  "yahtzee",
] as const;

export type GameType = (typeof GAME_TYPES)[number];

export function isGameType(value: unknown): value is GameType {
  return typeof value === "string" && (GAME_TYPES as readonly string[]).includes(value);
}
