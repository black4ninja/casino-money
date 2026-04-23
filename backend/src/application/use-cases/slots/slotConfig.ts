/**
 * Configuración compartida de la tragamonedas. Fuente de verdad en el
 * backend — el frontend re-declara los mismos símbolos para la UI, pero el
 * payout table y el RNG se aplican SIEMPRE en el servidor.
 *
 * Tema:
 *   patterns → rodillos muestran patrones GoF (ganan)
 *   anti     → anti-patrones en la fila central pierden todo
 *   wild     → el "0/Comodín" hace de comodín y da el jackpot triple
 */

export type SlotSymbolId =
  | "singleton"
  | "adapter"
  | "observer"
  | "god-object"
  | "spaghetti"
  | "zero";

export type SlotSymbolKind = "pattern" | "anti" | "wild";

export type SlotSymbol = {
  id: SlotSymbolId;
  kind: SlotSymbolKind;
};

/**
 * 6 símbolos únicos por rodillo. Probabilidad uniforme 1/6 cada uno para
 * mantener el payout table fácil de razonar. La combinación de payouts
 * empuja el RTP hacia ~85%.
 */
export const SLOT_SYMBOLS: readonly SlotSymbol[] = [
  { id: "singleton", kind: "pattern" },
  { id: "adapter", kind: "pattern" },
  { id: "observer", kind: "pattern" },
  { id: "god-object", kind: "anti" },
  { id: "spaghetti", kind: "anti" },
  { id: "zero", kind: "wild" },
];

export const SLOT_SYMBOL_IDS: readonly SlotSymbolId[] = SLOT_SYMBOLS.map(
  (s) => s.id,
);

export function isSlotSymbolId(value: unknown): value is SlotSymbolId {
  return typeof value === "string" &&
    (SLOT_SYMBOL_IDS as readonly string[]).includes(value);
}

export function findSlotSymbol(id: string): SlotSymbol | null {
  return SLOT_SYMBOLS.find((s) => s.id === id) ?? null;
}

/** Niveles de apuesta permitidos. Múltiplos de 100 para alinear con el wallet. */
export const BET_LEVELS = [100, 200, 500] as const;
export type BetLevel = (typeof BET_LEVELS)[number];

export function isBetLevel(value: unknown): value is BetLevel {
  return (
    typeof value === "number" && (BET_LEVELS as readonly number[]).includes(value)
  );
}

/** Cap duro del multiplicador — cualquier cambio de reglas debe respetarlo. */
export const MAX_MULTIPLIER = 5;

/** Etiquetas legibles para el cliente/reglas. */
export const SLOT_OUTCOMES = {
  JACKPOT_TRIPLE_WILD: "jackpot_triple_wild",
  TRIPLE_PATTERN: "triple_pattern",
  LINE_OF_PATTERNS: "line_of_patterns",
  TWO_WILDS_ONE_PATTERN: "two_wilds_one_pattern",
  WILD_COMPLETES_PAIR: "wild_completes_pair",
  PAIR: "pair",
  ANTI_PATTERN_LOSS: "anti_pattern_loss",
  NO_MATCH: "no_match",
} as const;

export type SlotOutcome = (typeof SLOT_OUTCOMES)[keyof typeof SLOT_OUTCOMES];
