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
    description:
      "El dealer roba una carta, anuncia una categoría — verdad o mentira — y los jugadores apuestan en tres zonas.",
    emoji: "🏦",
    digitalPath: null,
    rulesPath: "/juegos/banca-sabe/reglas",
  },
  {
    id: "poker_holdem",
    name: "Poker Hold’em",
    description:
      "Cada jugador recibe 2 cartas de patrón; se revelan 5 comunitarias en flop/turn/river y el grupo vota el mejor argumento.",
    emoji: "♠",
    digitalPath: null,
    rulesPath: "/juegos/poker-holdem/reglas",
  },
  {
    id: "blackjack",
    name: "Blackjack",
    description:
      "Plántate antes de que se acaben las 6 pistas. Menos pistas vistas = mayor multiplicador. El UML completo paga doble.",
    emoji: "♣",
    digitalPath: null,
    rulesPath: "/juegos/blackjack/reglas",
  },
  {
    id: "showdown",
    name: "Showdown",
    description:
      "Una carta privada contra un escenario compartido. Dos rondas de apuesta, un descarte opcional y el grupo vota el mejor argumento.",
    emoji: "⚔",
    digitalPath: null,
    rulesPath: "/juegos/showdown/reglas",
  },
  {
    id: "cubilete",
    name: "Cubilete",
    description:
      "Cada jugador esconde 5 dados. Apuestan cuántos dados de una categoría hay en la mesa. ¡Dudo!, ¡Exacto! y pregunta de rescate.",
    emoji: "🎲",
    digitalPath: null,
    rulesPath: "/juegos/cubilete/reglas",
  },
  {
    id: "tira_o_paga",
    name: "Tira o Paga",
    description:
      "El lanzador anuncia un patrón, el dado decide dificultad y todos compiten al tiempo para resolver. Multiplicadores ×2/×3/×5.",
    emoji: "🎯",
    digitalPath: null,
    rulesPath: "/juegos/tira-o-paga/reglas",
  },
  {
    id: "yahtzee",
    name: "Yahtzee",
    description:
      "La mesa donde menos aprendes pero más te diviertes. Mini retos con dados y del mundo real; al cierre escribes algo y el mejor escrito se lleva el pozo.",
    emoji: "🎰",
    digitalPath: null,
    rulesPath: "/juegos/yahtzee/reglas",
  },
];

export function findGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}

/** Human label for a game id. Falls back to the raw id if not found. */
export function gameLabel(id: string): string {
  return findGame(id)?.name ?? id;
}
