/**
 * Chip denominations follow real-casino conventions.
 * The color palette is the visual language of every Chip atom.
 */
export const DENOMINATIONS = [10, 50, 100, 500, 1000] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

export function isDenomination(value: unknown): value is Denomination {
  return (
    typeof value === "number" &&
    (DENOMINATIONS as readonly number[]).includes(value)
  );
}

export type ChipStyle = {
  /** Main face color. */
  body: string;
  /** Inset ring color. */
  accent: string;
  /** Outer edge dashes that evoke real chips. */
  edge: string;
  /** Denomination text color. */
  text: string;
};

export const CHIP_STYLES: Record<Denomination, ChipStyle> = {
  10: {
    body: "#F8F4EA",
    accent: "#C9B781",
    edge: "#A4161A",
    text: "#062A1F",
  },
  50: {
    body: "#A4161A",
    accent: "#F5E6CA",
    edge: "#F5E6CA",
    text: "#F5E6CA",
  },
  100: {
    body: "#1A1A1A",
    accent: "#D4AF37",
    edge: "#D4AF37",
    text: "#F5E6CA",
  },
  500: {
    body: "#3A1C71",
    accent: "#F5E6CA",
    edge: "#D4AF37",
    text: "#F5E6CA",
  },
  1000: {
    body: "#D4AF37",
    accent: "#1A1A1A",
    edge: "#1A1A1A",
    text: "#1A1A1A",
  },
};
