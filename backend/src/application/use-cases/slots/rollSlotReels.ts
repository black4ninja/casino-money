import { randomInt as cryptoRandomInt } from "node:crypto";
import { SLOT_SYMBOL_IDS, type SlotSymbolId } from "./slotConfig.js";

/**
 * Elige 3 símbolos de los rodillos — uno por rodillo, probabilidad uniforme
 * 1/6 por rodillo, independientes entre sí. Usa `crypto.randomInt` del runtime
 * (CSPRNG). El RNG vive SOLO en el servidor; el cliente recibe el resultado
 * y lo anima, sin oportunidad de predecirlo.
 */
export function rollSlotReels(
  rng: (minInclusive: number, maxExclusive: number) => number = cryptoRandomInt,
): [SlotSymbolId, SlotSymbolId, SlotSymbolId] {
  const n = SLOT_SYMBOL_IDS.length;
  return [
    SLOT_SYMBOL_IDS[rng(0, n)]!,
    SLOT_SYMBOL_IDS[rng(0, n)]!,
    SLOT_SYMBOL_IDS[rng(0, n)]!,
  ];
}
