/**
 * Configuración visual de la tragamonedas — espejo del backend
 * `backend/src/application/use-cases/slots/slotConfig.ts`. El servidor es la
 * fuente de verdad para el payout table y el RNG; aquí solo describimos cómo
 * se ven los símbolos y qué montos puede seleccionar el jugador.
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
  name: string;
  /** Nombre corto para caber dentro de la celda del rodillo. */
  shortName: string;
  kind: SlotSymbolKind;
  /** Tono de la familia de chips; el fondo del símbolo usa este color. */
  tone: "gold" | "info" | "danger" | "success";
  /** `null` cuando no hay arte dedicado — usamos fallback con inicial + fondo tono. */
  images: { avif: string; webp: string } | null;
  /** Glifo/emoji complementario visible en la celda cuando no hay imagen. */
  glyph: string;
};

export const SLOT_SYMBOLS: readonly SlotSymbol[] = [
  {
    id: "singleton",
    name: "Singleton",
    shortName: "Singleton",
    kind: "pattern",
    tone: "gold",
    images: {
      avif: "/images/patterns/singleton.avif",
      webp: "/images/patterns/singleton.webp",
    },
    glyph: "S",
  },
  {
    id: "adapter",
    name: "Adapter",
    shortName: "Adapter",
    kind: "pattern",
    tone: "info",
    images: {
      avif: "/images/patterns/adapter.avif",
      webp: "/images/patterns/adapter.webp",
    },
    glyph: "A",
  },
  {
    id: "observer",
    name: "Observer",
    shortName: "Observer",
    kind: "pattern",
    tone: "danger",
    images: {
      avif: "/images/patterns/observer.avif",
      webp: "/images/patterns/observer.webp",
    },
    glyph: "O",
  },
  {
    id: "god-object",
    name: "God Object",
    shortName: "God Object",
    kind: "anti",
    tone: "danger",
    images: null,
    glyph: "☠",
  },
  {
    id: "spaghetti",
    name: "Spaghetti Code",
    shortName: "Spaghetti",
    kind: "anti",
    tone: "danger",
    images: null,
    glyph: "🍝",
  },
  {
    id: "zero",
    name: "Comodín",
    shortName: "0",
    kind: "wild",
    tone: "success",
    images: null,
    glyph: "0",
  },
];

export function findSlotSymbol(id: string): SlotSymbol | null {
  return SLOT_SYMBOLS.find((s) => s.id === id) ?? null;
}

export const SLOT_BETS = [100, 200, 500] as const;
export type SlotBet = (typeof SLOT_BETS)[number];

export function isSlotBet(value: number): value is SlotBet {
  return (SLOT_BETS as readonly number[]).includes(value);
}

/** Descripción de la tabla de payouts para mostrar en el panel de reglas. */
export const SLOT_PAYOUT_RULES: readonly {
  combo: string;
  multiplier: string;
  tone: "gold" | "info" | "danger" | "success";
}[] = [
  { combo: "3 Zero (jackpot)", multiplier: "5×", tone: "gold" },
  { combo: "3 mismo patrón", multiplier: "3×", tone: "gold" },
  { combo: "2 Zero + 1 patrón", multiplier: "2×", tone: "info" },
  { combo: "1 Zero + 2 patrones iguales", multiplier: "2×", tone: "info" },
  { combo: "3 patrones distintos (línea limpia)", multiplier: "2×", tone: "info" },
  { combo: "2 iguales + 1 distinto", multiplier: "1× (reembolso)", tone: "success" },
  { combo: "Cualquier anti-patrón", multiplier: "0× (pierde)", tone: "danger" },
];

export const SLOT_MAX_MULTIPLIER = 5;
