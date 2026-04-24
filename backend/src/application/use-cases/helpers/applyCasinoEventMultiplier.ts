import type { CasinoEvent } from "../../../domain/entities/CasinoEvent.js";
import type { TransactionKind } from "../../../domain/entities/TransactionKind.js";

export type EventMultiplierResult = {
  /**
   * Monto después de aplicar multiplicadores. Conserva el signo original:
   *   - Depósito con WIN_DOUBLE activo: 500 → 1000
   *   - Débito con LOSS_DOUBLE activo: -500 → -1000
   * Si ningún evento aplica, devuelve el amount sin cambios.
   */
  amount: number;
  /**
   * Nombres de los eventos que aplicaron. Se usan para anexar al note de la
   * tx y dejar rastro auditable ("Evento: Noche de la suerte (x2)").
   * Vacío si no aplicó ningún evento.
   */
  appliedEventNames: string[];
  /** Multiplicador compuesto aplicado. 1 = sin efecto. */
  multiplier: number;
};

/**
 * Decide si los eventos activos del casino deben multiplicar esta transacción.
 *
 * Reglas por kind:
 *   player_deposit, global_credit  (delta > 0)  → WIN_DOUBLE     duplica
 *   player_debit                   (delta < 0)  → LOSS_DOUBLE    duplica |amount|
 *   slot_payout                    (delta > 0)  → SLOT_DOUBLE    duplica
 *   carrera_payout                 (delta > 0)  → CARRERA_DOUBLE duplica
 *
 * No aplica a transferencias entre jugadores, apuestas (bets) de slot/carrera,
 * ni compras de subasta — esas mantienen su monto tal cual. El `greedy_reward`
 * se maneja directo en su use case (reward es un literal, no un amount
 * variable) — no se mapea aquí.
 *
 * Si hay múltiples eventos activos del mismo type (no debería, SetActive lo
 * previene, pero por robustez) el multiplicador no se compone — se toma 2x
 * una sola vez.
 */
export function applyCasinoEventMultiplier(
  events: CasinoEvent[],
  kind: TransactionKind,
  amount: number,
): EventMultiplierResult {
  const targetType = resolveEventType(kind, amount);
  if (!targetType) {
    return { amount, appliedEventNames: [], multiplier: 1 };
  }

  const hit = events.find((e) => e.active && e.type === targetType);
  if (!hit) {
    return { amount, appliedEventNames: [], multiplier: 1 };
  }

  return {
    amount: amount * 2,
    appliedEventNames: [hit.name],
    multiplier: 2,
  };
}

function resolveEventType(
  kind: TransactionKind,
  amount: number,
): CasinoEvent["type"] | null {
  if (amount > 0) {
    if (kind === "player_deposit" || kind === "global_credit") return "WIN_DOUBLE";
    if (kind === "slot_payout") return "SLOT_DOUBLE";
    if (kind === "carrera_payout") return "CARRERA_DOUBLE";
    return null;
  }
  if (amount < 0) {
    if (kind === "player_debit") return "LOSS_DOUBLE";
    return null;
  }
  return null;
}

/**
 * Devuelve el note para persistir en la tx combinando el note manual del
 * actor y los eventos aplicados. Si no aplicó ninguno, devuelve el note
 * original tal cual.
 */
export function annotateNoteWithEvents(
  note: string | null,
  appliedEventNames: string[],
  multiplier: number,
): string | null {
  if (appliedEventNames.length === 0) return note;
  const tag = `Evento: ${appliedEventNames.join(", ")} (x${multiplier})`;
  if (!note || note.trim().length === 0) return tag;
  return `${note} — ${tag}`;
}
