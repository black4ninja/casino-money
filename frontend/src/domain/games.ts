/**
 * Registry of games in the /juegos area. Each game can be purely physical
 * (no `digitalPath`), purely digital, or hybrid (physical board + digital
 * support such as the roulette wheel).
 *
 * The `id` list here MUST stay in sync with the backend's GAME_TYPES in
 * `backend/src/domain/entities/GameType.ts` — the backend uses only the
 * ids, labels live here on the frontend.
 */
export type Game = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Where to open the digital version. `null` for purely-physical games. */
  digitalPath: string | null;
  /** Where to read the rules + walkthrough. `null` until rules are written. */
  rulesPath: string | null;
};

export const GAMES: readonly Game[] = [
  {
    id: "ruleta",
    name: "Ruleta de Patrones",
    description:
      "Tablero físico + rueda digital. Los jugadores apuestan sobre patrones GoF y la rueda revela el ganador.",
    emoji: "🎡",
    digitalPath: "/juegos/ruleta",
    rulesPath: "/juegos/ruleta/reglas",
  },
  {
    id: "la_banca_sabe",
    name: "La Banca Sabe",
    description: "Mesa conducida por un tallador; los jugadores retan a la banca.",
    emoji: "🏦",
    digitalPath: null,
    rulesPath: null,
  },
  {
    id: "poker_holdem",
    name: "Poker Hold’em",
    description: "Texas Hold’em tradicional con cartas físicas.",
    emoji: "♠",
    digitalPath: null,
    rulesPath: null,
  },
  {
    id: "blackjack",
    name: "Blackjack",
    description: "21 clásico con mesa física.",
    emoji: "♣",
    digitalPath: null,
    rulesPath: null,
  },
  {
    id: "showdown",
    name: "Showdown",
    description: "Duelo de cartas cara a cara.",
    emoji: "⚔",
    digitalPath: null,
    rulesPath: null,
  },
  {
    id: "cubilete",
    name: "Cubilete",
    description: "Juego de dados con cubilete.",
    emoji: "🎲",
    digitalPath: null,
    rulesPath: null,
  },
  {
    id: "tira_o_paga",
    name: "Tira o Paga",
    description: "Dados rápidos: tiras para ganar o pagas.",
    emoji: "🎯",
    digitalPath: null,
    rulesPath: null,
  },
  {
    id: "yahtzee",
    name: "Yahtzee",
    description: "Clásico de dados con combinaciones puntuables.",
    emoji: "🎰",
    digitalPath: null,
    rulesPath: null,
  },
];

export function findGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

/** Human label for a game id. Falls back to the raw id if not found. */
export function gameLabel(id: string): string {
  return findGame(id)?.name ?? id;
}
