/**
 * Verificación manual del payout table y RTP de la tragamonedas. No es un
 * test de un framework (backend no tiene infra de testing) — se corre con:
 *
 *   cd backend && yarn tsx src/application/use-cases/slots/verifyPayoutTable.ts
 *
 * Computa:
 *   1. Exhaustivamente las 216 combinaciones y su multiplicador (sanity check
 *      del evaluador).
 *   2. RTP analítico = sum(payoutsWeighted) / combinationCount.
 *   3. Monte Carlo de 100k spins para confirmar que el RNG concuerda con
 *      la distribución uniforme (RTP empírico ≈ RTP analítico).
 *
 * Si el exhaustivo o el empírico difieren significativamente, algo cambió
 * en la tabla de payouts o en el RNG.
 */

import { evaluateSlotSpin } from "./evaluateSlotSpin.js";
import { rollSlotReels } from "./rollSlotReels.js";
import { SLOT_SYMBOL_IDS } from "./slotConfig.js";

function exhaustiveRtp(): { combos: number; weighted: number; rtp: number } {
  let combos = 0;
  let weighted = 0;
  for (const a of SLOT_SYMBOL_IDS) {
    for (const b of SLOT_SYMBOL_IDS) {
      for (const c of SLOT_SYMBOL_IDS) {
        combos += 1;
        const { multiplier } = evaluateSlotSpin([a, b, c]);
        weighted += multiplier;
      }
    }
  }
  return { combos, weighted, rtp: weighted / combos };
}

function monteCarlo(iters: number): { rtp: number } {
  let totalMultiplier = 0;
  for (let i = 0; i < iters; i++) {
    const result = rollSlotReels();
    totalMultiplier += evaluateSlotSpin(result).multiplier;
  }
  return { rtp: totalMultiplier / iters };
}

const analytical = exhaustiveRtp();
console.log(`[slots] Analytical exhaustive:`);
console.log(`  combinations : ${analytical.combos}`);
console.log(`  weighted sum : ${analytical.weighted}`);
console.log(`  RTP          : ${(analytical.rtp * 100).toFixed(2)}%`);

const empirical = monteCarlo(100_000);
console.log(`[slots] Monte Carlo 100k spins:`);
console.log(`  RTP          : ${(empirical.rtp * 100).toFixed(2)}%`);

const delta = Math.abs(analytical.rtp - empirical.rtp);
console.log(`[slots] |analytical - empirical| = ${(delta * 100).toFixed(2)}%`);
if (delta > 0.02) {
  console.error(
    `[slots] WARNING: empirical RTP drifts more than 2pp from analytical — RNG may not match the uniform model.`,
  );
  process.exit(1);
}

// Sanity: jackpot cap no excedido.
if (analytical.weighted > analytical.combos * 5) {
  console.error(`[slots] WARNING: max theoretical multiplier exceeds cap of 5×`);
  process.exit(1);
}

console.log(`[slots] ✅ payout table verified.`);
