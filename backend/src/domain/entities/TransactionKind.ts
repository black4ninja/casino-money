/**
 * Tipos de movimiento en el ledger de wallet:
 *   global_credit        → crédito masivo a todos los jugadores del roster.
 *   player_deposit       → depósito individual del staff a un jugador.
 *   player_debit         → cobro/extracción del staff al saldo del jugador.
 *   player_transfer_out  → pierna emisora de una transferencia jugador→jugador.
 *   player_transfer_in   → pierna receptora de una transferencia jugador→jugador.
 *   slot_bet             → débito de la apuesta al jalar la palanca.
 *   slot_payout          → crédito del premio al ganar en la tragamonedas.
 *   carrera_bet          → débito al apostar en la Carrera de Patrones.
 *   carrera_payout       → crédito del premio cuando la apuesta de la carrera gana.
 *   auction_purchase     → débito al ganador cuando el anunciador cierra con "Vendido".
 *   greedy_reward        → crédito del mini-clicker Greedy; el jugador acumula
 *                          10 toques locales y cobra +1 al saldo.
 *
 * Reglas de signo:
 *   global_credit, player_deposit, player_transfer_in, slot_payout,
 *     carrera_payout, greedy_reward                                   → delta > 0.
 *   player_debit, player_transfer_out, slot_bet, carrera_bet,
 *     auction_purchase                                                → delta < 0.
 */
export type TransactionKind =
  | "global_credit"
  | "player_deposit"
  | "player_debit"
  | "player_transfer_out"
  | "player_transfer_in"
  | "slot_bet"
  | "slot_payout"
  | "carrera_bet"
  | "carrera_payout"
  | "auction_purchase"
  | "greedy_reward";

export const TRANSACTION_KINDS: readonly TransactionKind[] = [
  "global_credit",
  "player_deposit",
  "player_debit",
  "player_transfer_out",
  "player_transfer_in",
  "slot_bet",
  "slot_payout",
  "carrera_bet",
  "carrera_payout",
  "auction_purchase",
  "greedy_reward",
] as const;

export function isTransactionKind(value: unknown): value is TransactionKind {
  return (
    typeof value === "string" &&
    (TRANSACTION_KINDS as readonly string[]).includes(value)
  );
}

/** Kinds cuyo delta debe ser negativo (débitos de saldo). */
export const DEBIT_KINDS: readonly TransactionKind[] = [
  "slot_bet",
  "carrera_bet",
  "player_debit",
  "player_transfer_out",
  "auction_purchase",
];

export function isDebitKind(kind: TransactionKind): boolean {
  return (DEBIT_KINDS as readonly string[]).includes(kind);
}

export type TransactionStatus =
  | "pending"
  | "committed"
  | "committed_recovered"
  | "failed";

export const TRANSACTION_STATUSES: readonly TransactionStatus[] = [
  "pending",
  "committed",
  "committed_recovered",
  "failed",
] as const;

export function isTransactionStatus(value: unknown): value is TransactionStatus {
  return (
    typeof value === "string" &&
    (TRANSACTION_STATUSES as readonly string[]).includes(value)
  );
}
