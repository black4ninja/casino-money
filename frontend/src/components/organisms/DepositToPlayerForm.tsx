import { useCallback, useRef, useState } from "react";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import {
  AmountPicker,
  AMOUNT_DEFAULT,
  formatMxn,
} from "@/components/molecules/AmountPicker";
import { useAuthStore } from "@/stores/authStore";
import {
  apiCreditPlayer,
  type CreditPlayerResult,
} from "@/lib/economyApi";
import type { ApiError } from "@/lib/authApi";
import type { AuthUser } from "@/storage/auth";

function newBatchId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `dep-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type Props = {
  casinoId: string;
  player: AuthUser;
  currentBalance: number;
  onClose: () => void;
  /** Se invoca cuando el depósito resultó en un crédito exitoso. */
  onDeposited: (newBalance: number) => void;
};

export function DepositToPlayerForm({
  casinoId,
  player,
  currentBalance,
  onClose,
  onDeposited,
}: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [amount, setAmount] = useState<number>(AMOUNT_DEFAULT);
  const batchIdRef = useRef<string>(newBatchId());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreditPlayerResult | null>(null);

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

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await withAuth((t) =>
        apiCreditPlayer(t, casinoId, player.id, {
          amount,
          batchId: batchIdRef.current,
        }),
      );
      setResult(res);
      if (res.outcome.status === "failed") {
        setError(res.outcome.reason || "El depósito falló");
        return;
      }
      if (res.outcome.balance !== null) {
        onDeposited(res.outcome.balance);
      }
      batchIdRef.current = newBatchId();
      // Cierra el modal tras un depósito exitoso. El `onDeposited` ya propagó
      // el nuevo saldo al padre, así que la lista se actualiza antes del
      // unmount. Si `outcome.status === "failed"` ya regresamos arriba, así
      // que aquí solo llegamos en credited/skipped/recovered.
      onClose();
    } catch (err) {
      const e = err as ApiError;
      setError(e.message ?? "No se pudo depositar");
    } finally {
      setSubmitting(false);
    }
  }

  const displayName = player.alias || player.fullName || player.matricula;
  const projectedBalance = currentBalance + amount;

  return (
    <Card tone="night" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Badge tone="gold">Depositar a jugador</Badge>
        <h2 className="font-display text-2xl text-[--color-ivory]">
          {displayName}
        </h2>
        <div className="flex flex-wrap items-baseline gap-2 text-xs text-[--color-cream]/70">
          <span className="font-mono">{player.matricula}</span>
          {player.departamento && (
            <>
              <span aria-hidden>·</span>
              <span>{player.departamento}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-[--color-felt-800]/60 px-4 py-3 ring-1 ring-inset ring-white/5">
        <div className="flex flex-col">
          <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
            Saldo actual
          </span>
          <span className="font-display text-lg text-[--color-ivory]">
            {formatMxn(currentBalance)}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
            Quedará en
          </span>
          <span className="font-display text-2xl text-[--color-gold-300]">
            {formatMxn(projectedBalance)}
          </span>
        </div>
      </div>

      <AmountPicker
        value={amount}
        onChange={handleAmountChange}
        disabled={submitting}
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="ghost"
          size="md"
          onClick={onClose}
          disabled={submitting}
          className="sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={submitting}
          block
          className="touch-manipulation"
        >
          {submitting ? "Depositando…" : `Depositar ${formatMxn(amount)}`}
        </Button>
      </div>

      {result && !error && (
        <div
          role="status"
          className="rounded-xl bg-[--color-chip-green-500]/15 px-4 py-3 ring-1 ring-inset ring-[--color-chip-green-400]/40"
        >
          <p className="font-display text-[--color-ivory]">
            {result.outcome.status === "skipped"
              ? "Ya había recibido este batch · sin doble cargo"
              : `Depósito registrado · nuevo saldo ${formatMxn(
                  result.outcome.balance ?? currentBalance,
                )}`}
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl bg-[--color-chip-red-500]/15 px-4 py-3 ring-1 ring-inset ring-[--color-chip-red-400]/40"
        >
          <p className="font-label text-sm tracking-wider text-[--color-carmine-400]">
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
