/**
 * Comisión que recibe el dealer al cobrar fichas a un jugador.
 *
 * Fórmula: 20% del monto efectivo del cobro, redondeado hacia abajo al
 * múltiplo de 100 más cercano. El 80% restante se destruye (mantiene la
 * deflación histórica del débito — solo que un pedazo ahora sobrevive
 * como saldo personal del dealer para que pueda pujar en subastas).
 *
 * Ejemplos:
 *    $100  → $0    (20 → floor100 = 0)
 *    $400  → $0    (80 → 0)
 *    $500  → $100  (100 → 100)
 *    $600  → $100  (120 → 100)
 *    $1000 → $200
 *    $5000 → $1000
 *    $100000 → $20000
 *
 * Cobros menores a $500 no generan comisión (efecto natural del redondeo).
 * Esto protege que los micro-cobros no acumulen dealer-riqueza masiva.
 *
 * Solo aplica a `player_debit`. Los créditos al jugador (depósitos, payouts
 * de juegos, bulk-credit) son emisión de la casa — no "cobran" nada al
 * dealer, así que no hay comisión que extraer ahí.
 */
export const DEALER_COMMISSION_RATE = 0.20;
export const DEALER_COMMISSION_ROUNDING = 100;

export function calcDealerCommission(effectiveDebit: number): number {
  if (!Number.isFinite(effectiveDebit) || effectiveDebit <= 0) return 0;
  const raw = effectiveDebit * DEALER_COMMISSION_RATE;
  const rounded =
    Math.floor(raw / DEALER_COMMISSION_ROUNDING) * DEALER_COMMISSION_ROUNDING;
  return rounded;
}
