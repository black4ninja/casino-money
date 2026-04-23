import {
  findSlotSymbol,
  MAX_MULTIPLIER,
  SLOT_OUTCOMES,
  type SlotOutcome,
  type SlotSymbolId,
} from "./slotConfig.js";

export type SlotEvaluation = {
  multiplier: number;
  outcome: SlotOutcome;
};

/**
 * Función pura: dados 3 símbolos de la fila central, devuelve el multiplicador
 * y el tipo de jugada.
 *
 * RTP resultante (analítico): **~37%** con distribución uniforme 1/6 por
 * rodillo. Intencionalmente bajo — el objetivo de la máquina es entretenimiento
 * para jugadores pasivos SIN generar mucho dinero (la casa gana ~63% a largo
 * plazo). Si se quiere relajar la agresividad, la primera palanca es subir
 * los multiplicadores en las reglas 6/7 (línea limpia / pareja).
 *
 * Orden de evaluación (primero el que matchea gana):
 *
 *   1. Cualquier anti-patrón presente → 0× (castigo temático fuerte).
 *   2. 3 zero (wild)                   → 5× (JACKPOT).
 *   3. 3 mismo patrón exacto           → 3×.
 *   4. 2 wild + 1 patrón               → 2×.
 *   5. 1 wild + 2 patrones iguales     → 2× (el wild completa el par).
 *   6. 3 patrones distintos            → 2× (línea limpia de GoF).
 *   7. 2 patrones iguales + 1 distinto → 1× (reembolso).
 *   8. Cualquier otra combinación      → 0×.
 *
 * Todas las reglas respetan `MAX_MULTIPLIER`. El multiplicador devuelto se
 * aplica SOBRE la apuesta para calcular payout (0 = pierde toda la apuesta,
 * 1 = reembolso exacto, >1 = ganancia neta).
 */
export function evaluateSlotSpin(
  result: readonly [string, string, string],
): SlotEvaluation {
  const symbols = result.map((id) => findSlotSymbol(id));
  if (symbols.some((s) => s === null)) {
    // Símbolo desconocido: tratamos como no-match seguro. No debería pasar si
    // rollSlotReels es el único productor, pero protege contra data corrupta.
    return { multiplier: 0, outcome: SLOT_OUTCOMES.NO_MATCH };
  }
  const [a, b, c] = symbols as [NonNullable<(typeof symbols)[number]>, NonNullable<(typeof symbols)[number]>, NonNullable<(typeof symbols)[number]>];

  // 1. Anti-patrón castiga siempre.
  if (a.kind === "anti" || b.kind === "anti" || c.kind === "anti") {
    return { multiplier: 0, outcome: SLOT_OUTCOMES.ANTI_PATTERN_LOSS };
  }

  const wildCount =
    (a.kind === "wild" ? 1 : 0) +
    (b.kind === "wild" ? 1 : 0) +
    (c.kind === "wild" ? 1 : 0);

  // 2. Tres wilds = jackpot.
  if (wildCount === 3) {
    return { multiplier: MAX_MULTIPLIER, outcome: SLOT_OUTCOMES.JACKPOT_TRIPLE_WILD };
  }

  // 3. Tres mismo patrón exacto (todos patrones, mismo id).
  if (
    wildCount === 0 &&
    a.kind === "pattern" &&
    b.kind === "pattern" &&
    c.kind === "pattern" &&
    a.id === b.id &&
    b.id === c.id
  ) {
    return { multiplier: 3, outcome: SLOT_OUTCOMES.TRIPLE_PATTERN };
  }

  // 4. Dos wilds + un patrón.
  if (wildCount === 2) {
    return { multiplier: 2, outcome: SLOT_OUTCOMES.TWO_WILDS_ONE_PATTERN };
  }

  // 5. Un wild + dos patrones iguales (el wild cuenta como tercero).
  if (wildCount === 1) {
    const patterns = [a, b, c].filter((s) => s.kind === "pattern");
    if (patterns.length === 2 && patterns[0]!.id === patterns[1]!.id) {
      return { multiplier: 2, outcome: SLOT_OUTCOMES.WILD_COMPLETES_PAIR };
    }
    // 1 wild + 2 patrones distintos → no-match.
    return { multiplier: 0, outcome: SLOT_OUTCOMES.NO_MATCH };
  }

  // Aquí ya sabemos wildCount === 0 y todos son patrones (ya descartamos anti).
  const ids: SlotSymbolId[] = [a.id, b.id, c.id] as SlotSymbolId[];
  const uniqueIds = new Set(ids).size;

  // 6. 3 patrones distintos (no-pair, no-triple) → línea limpia.
  if (uniqueIds === 3) {
    return { multiplier: 2, outcome: SLOT_OUTCOMES.LINE_OF_PATTERNS };
  }

  // 7. 2 iguales + 1 distinto (uniqueIds === 2).
  if (uniqueIds === 2) {
    return { multiplier: 1, outcome: SLOT_OUTCOMES.PAIR };
  }

  // Nunca debería llegar aquí con patrones (3 iguales ya fue capturado).
  return { multiplier: 0, outcome: SLOT_OUTCOMES.NO_MATCH };
}
