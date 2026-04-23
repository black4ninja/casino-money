import { useCallback, useMemo, useRef, useState } from "react";
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
  apiBulkCreditCasinoPlayers,
  type BulkCreditResult,
} from "@/lib/economyApi";
import type { ApiError } from "@/lib/authApi";

function newBatchId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

type Props = {
  casinoId: string;
  canCredit: boolean;
  playerCount: number;
  playersLoading: boolean;
  /** Se llama tras un bulk-credit exitoso (creditó o recuperó al menos uno). */
  onCredited?: () => void;
};

export function BulkCreditPanel({
  casinoId,
  canCredit,
  playerCount,
  playersLoading,
  onCredited,
}: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [amount, setAmount] = useState<number>(AMOUNT_DEFAULT);
  const batchIdRef = useRef<string>(newBatchId());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkCreditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const total = amount * playerCount;

  function handleAmountChange(next: number) {
    if (next === amount) return;
    setAmount(next);
    // Cambiar el monto reinicia el batch: el siguiente "Entregar" será una
    // nueva ronda, no un reintento del anterior.
    batchIdRef.current = newBatchId();
    setResult(null);
    setError(null);
  }

  async function handleSubmit() {
    if (submitting || !canCredit || playerCount === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await withAuth((t) =>
        apiBulkCreditCasinoPlayers(t, casinoId, {
          amount,
          batchId: batchIdRef.current,
        }),
      );
      setResult(res);
      // Rotamos batchId tras éxito → la próxima entrega con el mismo amount
      // es una ronda distinta (no idempotencia-skip).
      batchIdRef.current = newBatchId();
      if (res.creditedCount > 0) {
        onCredited?.();
      }
    } catch (err) {
      const e = err as ApiError;
      setError(e.message ?? "No se pudo entregar las fichas");
      // NO rotamos batchId: reintentar usa la idempotencia del backend.
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = !canCredit || playerCount === 0 || submitting;
  const disabledReason = useMemo(() => {
    if (!canCredit) return "Reactiva el casino para entregar fichas";
    if (playersLoading) return "Cargando jugadores…";
    if (playerCount === 0) return "El casino no tiene jugadores todavía";
    return undefined;
  }, [canCredit, playerCount, playersLoading]);

  return (
    <Card tone="night" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-[--color-ivory]">
            Entregar fichas a todos
          </h3>
          <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
            El mismo monto se acredita a cada jugador del casino.
          </p>
        </div>
        <Badge tone="gold">Denominación $100</Badge>
      </div>

      <AmountPicker
        value={amount}
        onChange={handleAmountChange}
        disabled={submitting}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-[--color-felt-800]/60 px-4 py-3 ring-1 ring-inset ring-white/5">
        <div className="flex flex-col">
          <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
            Jugadores
          </span>
          <span className="font-display text-lg text-[--color-ivory]">
            {playersLoading ? "—" : playerCount}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
            Total a entregar
          </span>
          <span className="font-display text-2xl text-[--color-gold-300]">
            {playersLoading ? "—" : formatMxn(total)}
          </span>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        block
        onClick={handleSubmit}
        disabled={disabled}
        title={disabledReason}
        className="touch-manipulation"
      >
        {submitting
          ? "Entregando…"
          : `Entregar ${formatMxn(amount)} a todos`}
      </Button>

      {result && !error && (
        <div
          role="status"
          className="rounded-xl bg-[--color-chip-green-500]/15 px-4 py-3 ring-1 ring-inset ring-[--color-chip-green-400]/40"
        >
          <p className="font-display text-[--color-ivory]">
            Fichas entregadas a {result.creditedCount} jugador
            {result.creditedCount === 1 ? "" : "es"} · {formatMxn(result.totalIssued)} total
          </p>
          {result.skippedCount > 0 && (
            <p className="mt-1 font-label text-xs tracking-widest text-[--color-cream]/70">
              {result.skippedCount} ya habían recibido este batch · sin doble cargo
            </p>
          )}
          {result.failedCount > 0 && (
            <p className="mt-1 font-label text-xs tracking-widest text-[--color-carmine-400]">
              {result.failedCount} fallaron · revisa la consola para detalle
            </p>
          )}
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
            Puedes volver a tocar el botón: el reintento es seguro (mismo batch).
          </p>
        </div>
      )}
    </Card>
  );
}
