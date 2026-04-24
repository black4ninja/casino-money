import type { WalletRepo } from "../../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../../domain/ports/WalletTransactionRepo.js";
import type { TransactionKind } from "../../../domain/entities/TransactionKind.js";

export type CreditPlayerOutcome =
  | { status: "credited"; balance: number }
  | { status: "skipped"; balance: number | null }
  | { status: "recovered"; balance: number }
  | { status: "failed"; balance: null; reason: string };

export type CreditPlayerCoreDeps = {
  wallets: WalletRepo;
  walletTxs: WalletTransactionRepo;
};

export type CreditPlayerCoreInput = {
  casinoId: string;
  userId: string;
  amount: number;
  batchId: string;
  actorId: string;
  note: string | null;
  kind: TransactionKind;
  /**
   * Sufijo opcional del idempotencyKey. Útil cuando una misma "operación
   * lógica" (mismo batchId) genera múltiples txs distinguibles — p. ej. la
   * tragamonedas emite "bet" y "payout" por cada spin y necesita dos llaves
   * únicas, o el `player_debit` que además acredita una comisión al dealer.
   * Omitir para mantener el comportamiento histórico `batchId:user`.
   */
  keySuffix?: string;
};

/**
 * Algoritmo idempotente para aplicar un delta al wallet de un usuario. El
 * nombre "credit" es legacy — acepta también deltas negativos (débitos) para
 * kinds como `slot_bet`, donde el flujo es: validar saldo en el caller, luego
 * invocar este helper con `amount < 0` para descontar. `$inc` de Mongo maneja
 * signo libremente y sigue siendo atómico. Compartido entre bulk-credit,
 * depósitos individuales, apuestas de la tragamonedas y la comisión del dealer.
 *
 * Garantías:
 *   - `idempotencyKey = ${batchId}:${userId}` previene doble-aplicación en
 *     reintentos con el mismo batchId.
 *   - `WalletRepo.incrementBalance` usa Parse `.increment()` → `$inc` de
 *     Mongo, atómico a nivel documento.
 *
 * Trade-off de recovery: si se encuentra una tx `pending` (crash previo
 * entre createPending e increment), se marca como `committed_recovered` SIN
 * re-incrementar. Preferimos perder un crédito raro antes que duplicar uno.
 * El admin puede detectar el caso por `status=committed_recovered` y
 * re-correr con un nuevo batchId si confirma que el saldo está incorrecto.
 *
 * Quien llama debe haber validado previamente: casino existe y active,
 * amount dentro del rango esperado para su kind (positivo para créditos,
 * negativo para débitos), batchId no-vacío, actorId no-vacío, y para débitos
 * que el usuario tenga saldo suficiente.
 */
export async function creditPlayerCore(
  deps: CreditPlayerCoreDeps,
  input: CreditPlayerCoreInput,
): Promise<CreditPlayerOutcome> {
  const key = input.keySuffix
    ? `${input.batchId}:${input.userId}:${input.keySuffix}`
    : `${input.batchId}:${input.userId}`;
  const existing = await deps.walletTxs.findByIdempotencyKey(key);

  if (
    existing &&
    (existing.status === "committed" ||
      existing.status === "committed_recovered")
  ) {
    return { status: "skipped", balance: existing.balanceAfter };
  }

  if (existing && existing.status === "pending") {
    const wallet = await deps.wallets.findByCasinoAndUser(
      input.casinoId,
      input.userId,
    );
    if (!wallet) {
      return {
        status: "failed",
        balance: null,
        reason: `wallet missing for pending tx ${existing.id}`,
      };
    }
    await deps.walletTxs.markRecovered(existing.id, wallet.balance);
    return { status: "recovered", balance: wallet.balance };
  }

  // Caso nuevo (o tx fallida previa — creamos una nueva con el mismo key).
  const wallet =
    (await deps.wallets.findByCasinoAndUser(
      input.casinoId,
      input.userId,
    )) ??
    (await deps.wallets.createForCasinoAndUser(
      input.casinoId,
      input.userId,
    ));

  const tx = await deps.walletTxs.createPending({
    walletId: wallet.id,
    casinoId: input.casinoId,
    userId: input.userId,
    kind: input.kind,
    delta: input.amount,
    idempotencyKey: key,
    batchId: input.batchId,
    actorId: input.actorId,
    note: input.note,
  });

  try {
    const newBalance = await deps.wallets.incrementBalance(
      wallet.id,
      input.amount,
    );
    await deps.walletTxs.markCommitted(tx.id, newBalance);
    return { status: "credited", balance: newBalance };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await deps.walletTxs.markFailed(tx.id, reason);
    return { status: "failed", balance: null, reason };
  }
}

const DENOMINATION = 100;
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 100_000;
const MAX_BATCH_ID_LEN = 128;

export function validateAmount(amount: unknown): string | null {
  if (typeof amount !== "number" || !Number.isInteger(amount)) {
    return "amount must be an integer";
  }
  if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    return `amount must be between ${MIN_AMOUNT} and ${MAX_AMOUNT}`;
  }
  if (amount % DENOMINATION !== 0) {
    return `amount must be a multiple of ${DENOMINATION}`;
  }
  return null;
}

export function validateBatchId(batchId: unknown): string | null {
  if (typeof batchId !== "string") return "batchId is required";
  const trimmed = batchId.trim();
  if (!trimmed) return "batchId is required";
  if (trimmed.length > MAX_BATCH_ID_LEN) {
    return `batchId must be at most ${MAX_BATCH_ID_LEN} chars`;
  }
  return null;
}
