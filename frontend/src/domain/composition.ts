import { DENOMINATIONS, type Denomination } from "./denominations";

export type Composition = Record<Denomination, number>;

export function emptyComposition(): Composition {
  return { 10: 0, 50: 0, 100: 0, 500: 0, 1000: 0 };
}

/** Greedy: fill with largest denomination first. Anything under $10 is dropped. */
export function composeGreedy(amount: number): Composition {
  const result = emptyComposition();
  let remaining = Math.max(0, Math.floor(amount));
  for (const d of [1000, 500, 100, 50, 10] as const) {
    const n = Math.floor(remaining / d);
    result[d] = n;
    remaining -= n * d;
  }
  return result;
}

/**
 * Welcome-style composition: starts with a small stack of change ($10 + $50)
 * before filling with large denoms. Nicer for a starter bundle because the
 * player has chips for small bets too, not just one big $500 chip.
 */
export function composeWelcome(amount: number): Composition {
  const result = emptyComposition();
  if (amount < 10) return result;

  // Minimum change reserves we'll try to include.
  const wantTens = amount >= 150 ? 5 : amount >= 50 ? 3 : amount >= 20 ? 2 : 1;
  const wantFifties = amount >= 300 ? 2 : amount >= 100 ? 1 : 0;

  let remaining = amount;
  const tens = Math.min(wantTens, Math.floor(remaining / 10));
  result[10] = tens;
  remaining -= tens * 10;
  const fifties = Math.min(wantFifties, Math.floor(remaining / 50));
  result[50] = fifties;
  remaining -= fifties * 50;

  // Fill the rest greedily with $100+, allowing more $50 at the end.
  for (const d of [1000, 500, 100] as const) {
    const n = Math.floor(remaining / d);
    result[d] += n;
    remaining -= n * d;
  }
  // Clean up residue with $50 then $10.
  while (remaining >= 50) {
    result[50]++;
    remaining -= 50;
  }
  while (remaining >= 10) {
    result[10]++;
    remaining -= 10;
  }
  return result;
}

export function compositionTotal(c: Composition): number {
  let sum = 0;
  for (const d of DENOMINATIONS) sum += c[d] * d;
  return sum;
}

export function compositionCount(c: Composition): number {
  let n = 0;
  for (const d of DENOMINATIONS) n += c[d];
  return n;
}
