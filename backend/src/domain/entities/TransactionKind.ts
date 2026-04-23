/**
 * Tipos de movimiento en el ledger de wallet:
 *   global_credit  → crédito masivo a todos los jugadores del roster de un casino.
 *   player_deposit → depósito individual del master a un jugador.
 *   slot_bet       → débito de la apuesta al jalar la palanca de la tragamonedas.
 *   slot_payout    → crédito del premio al ganar en la tragamonedas.
 *
 * Reglas de signo:
 *   global_credit, player_deposit, slot_payout  → delta siempre > 0.
 *   slot_bet                                    → delta siempre < 0.
 */
export type TransactionKind =
  | "global_credit"
  | "player_deposit"
  | "slot_bet"
  | "slot_payout";

export const TRANSACTION_KINDS: readonly TransactionKind[] = [
  "global_credit",
  "player_deposit",
  "slot_bet",
  "slot_payout",
] as const;

export function isTransactionKind(value: unknown): value is TransactionKind {
  return (
    typeof value === "string" &&
    (TRANSACTION_KINDS as readonly string[]).includes(value)
  );
}

/** Kinds cuyo delta debe ser negativo (débitos de saldo). */
export const DEBIT_KINDS: readonly TransactionKind[] = ["slot_bet"];

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
