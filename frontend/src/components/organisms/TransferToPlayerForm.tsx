import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import {
  AmountPicker,
  AMOUNT_DEFAULT,
  AMOUNT_DENOMINATION,
  AMOUNT_MIN,
  clampAmount,
  formatMxn,
} from "@/components/molecules/AmountPicker";
import { useAuthStore } from "@/stores/authStore";
import {
  apiTransferToPlayer,
  type TransferToPlayerResult,
} from "@/lib/economyApi";
import type { ApiError } from "@/lib/authApi";
import type { AuthUser } from "@/storage/auth";

function newBatchId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `xfer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Redondea `raw` al múltiplo inferior de `AMOUNT_DENOMINATION`. Se usa para
 * que "transferir todo" no sobrepase el saldo cuando este no es un múltiplo
 * exacto de $100 (p. ej. saldos impares por ajustes históricos).
 */
function floorToDenomination(raw: number): number {
  return Math.floor(raw / AMOUNT_DENOMINATION) * AMOUNT_DENOMINATION;
}

type Props = {
  casinoId: string;
  recipient: AuthUser;
  /** Saldo actual del emisor en este casino — límite duro de la transferencia. */
  senderBalance: number;
  /** Deja volver al paso de selección de jugador sin cerrar el modal. */
  onBack: () => void;
  onClose: () => void;
  /** Invocado tras una transferencia exitosa con el nuevo saldo del emisor. */
  onTransferred: (newSenderBalance: number) => void;
};

/**
 * Formulario de transferencia jugador→jugador. Hermano de DepositToPlayerForm
 * y DebitFromPlayerForm: mismo contrato visual (chips grandes, batchId
 * idempotente), pero el límite superior es el saldo del emisor, no un rango
 * arbitrario. Incluye un atajo "Transferir todo" que snap al múltiplo de
 * $100 más cercano inferior al saldo — evita transferir "casi todo" cuando
 * el saldo tiene colas no redondeadas.
 */
export function TransferToPlayerForm({
  casinoId,
  recipient,
  senderBalance,
  onBack,
  onClose,
  onTransferred,
}: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const maxTransferable = Math.max(0, floorToDenomination(senderBalance));
  // Arrancamos en el default habitual ($1500) pero cap al máximo real — así
  // el botón no pide más de lo que el jugador tiene desde el primer render.
  const initialAmount = Math.min(
    AMOUNT_DEFAULT,
    maxTransferable || AMOUNT_MIN,
  );
  const [amount, setAmount] = useState<number>(initialAmount);
  const batchIdRef = useRef<string>(newBatchId());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransferToPlayerResult | null>(null);

  const withAuth = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      if (!accessToken) throw { status: 401, message: "no token" } as ApiError;
      try {
        return await fn(accessToken);
      } catch (err) {
        const e = err as ApiError;
        if (e.status !== 401) throw err;
        const fresh = await refresh();
        return fn(fresh);
      }
    },
    [accessToken, refresh],
  );

  function handleAmountChange(next: number) {
    if (next === amount) return;
    setAmount(next);
    batchIdRef.current = newBatchId();
    setResult(null);
    setError(null);
  }

  function handleSendAll() {
    if (maxTransferable <= 0) return;
    handleAmountChange(clampAmount(maxTransferable));
  }

  const insufficientBalance = amount > maxTransferable;
  const nothingToSend = maxTransferable <= 0;

  async function handleSubmit() {
    if (submitting || insufficientBalance || nothingToSend) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await withAuth((t) =>
        apiTransferToPlayer(t, casinoId, {
          toPlayerId: recipient.id,
          amount,
          batchId: batchIdRef.current,
        }),
      );
      setResult(res);
      if (res.fromOutcome.status === "failed") {
        setError(res.fromOutcome.reason || "La transferencia falló.");
        return;
      }
      if (res.toOutcome.status === "failed") {
        // Débito aplicado pero crédito al receptor falló — el emisor perdió
        // saldo. Mostramos el detalle y pedimos avisar al maestro para que
        // reconcilie. El admin puede detectar esto por kind=player_transfer_in
        // con status=failed en el ledger.
        setError(
          `Tu saldo sí se descontó pero no pudo entregarse al destinatario (${res.toOutcome.reason}). Avisa al maestro para reconciliar.`,
        );
        if (res.fromOutcome.balance !== null) {
          onTransferred(res.fromOutcome.balance);
        }
        return;
      }
      if (res.fromOutcome.balance !== null) {
        onTransferred(res.fromOutcome.balance);
      }
      batchIdRef.current = newBatchId();
      onClose();
    } catch (err) {
      const e = err as ApiError;
      setError(e.message ?? "No se pudo transferir");
    } finally {
      setSubmitting(false);
    }
  }

  const displayName =
    recipient.alias || recipient.fullName || recipient.matricula;
  const projectedBalance = Math.max(0, senderBalance - amount);

  return (
    <Card tone="night" className="flex flex-col gap-5 !p-7 sm:!p-9">
      <div className="flex flex-col gap-1">
        <Badge tone="success">Transferir a jugador</Badge>
        <h2 className="font-display text-2xl text-[--color-ivory]">
          {displayName}
        </h2>
        <div className="flex flex-wrap items-baseline gap-2 text-xs text-[--color-cream]/70">
          <span className="font-mono">{recipient.matricula}</span>
          {recipient.departamento && (
            <>
              <span aria-hidden>·</span>
              <span>{recipient.departamento}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 rounded-xl bg-[--color-felt-800]/70 px-5 py-4">
        <div className="flex flex-col">
          <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
            Tu saldo
          </span>
          <span className="font-display text-lg text-[--color-ivory]">
            {formatMxn(senderBalance)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
            Te quedará
          </span>
          <span
            className={[
              "font-display text-2xl",
              insufficientBalance
                ? "text-[--color-chip-red-300]"
                : "text-[--color-chip-green-300]",
            ].join(" ")}
          >
            {insufficientBalance ? "—" : formatMxn(projectedBalance)}
          </span>
        </div>
      </div>

      <AmountPicker
        value={amount}
        onChange={handleAmountChange}
        disabled={submitting || nothingToSend}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
          Máx. transferible · {formatMxn(maxTransferable)}
        </span>
        <Button
          variant="gold"
          size="sm"
          onClick={handleSendAll}
          disabled={submitting || nothingToSend || amount === maxTransferable}
        >
          Transferir todo
        </Button>
      </div>

      {nothingToSend && (
        <p
          role="status"
          className="font-label text-xs tracking-wider text-[--color-chip-red-300]"
        >
          No tienes saldo para transferir.
        </p>
      )}

      {insufficientBalance && !nothingToSend && (
        <p
          role="status"
          className="font-label text-xs tracking-wider text-[--color-chip-red-300]"
        >
          Sólo puedes transferir hasta {formatMxn(maxTransferable)}.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="ghost"
          size="md"
          onClick={onBack}
          disabled={submitting}
          className="sm:w-auto"
        >
          ← Cambiar jugador
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={submitting || insufficientBalance || nothingToSend}
          block
          className="touch-manipulation"
        >
          {submitting ? "Transfiriendo…" : `Transferir ${formatMxn(amount)}`}
        </Button>
      </div>

      {result &&
        !error &&
        result.fromOutcome.status !== "failed" &&
        result.toOutcome.status !== "failed" && (
          <div
            role="status"
            className="rounded-xl bg-[--color-chip-green-500]/15 px-4 py-3 ring-1 ring-inset ring-[--color-chip-green-400]/40"
          >
            <p className="font-display text-[--color-ivory]">
              {result.fromOutcome.status === "skipped"
                ? "Ya se había enviado esta transferencia · sin doble cargo"
                : `Transferencia realizada · tu nuevo saldo ${formatMxn(
                    result.fromOutcome.balance ?? senderBalance,
                  )}`}
            </p>
          </div>
        )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-[--color-chip-red-500]/15 px-4 py-3 ring-1 ring-inset ring-[--color-chip-red-400]/40"
        >
          <p className="font-label text-sm tracking-wider text-[--color-chip-red-300]">
            {error}
          </p>
          <p className="mt-1 font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/60">
            Reintenta: el mismo batch es seguro (idempotente).
          </p>
        </div>
      )}
    </Card>
  );
}
