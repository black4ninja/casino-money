import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { formatMxn } from "@/components/molecules/AmountPicker";
import { useAuthStore } from "@/stores/authStore";
import {
  apiListPlayerCasinoTransactions,
  type WalletTransaction,
} from "@/lib/economyApi";
import type { ApiError } from "@/lib/authApi";
import type { AuthUser } from "@/storage/auth";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kindLabel(kind: WalletTransaction["kind"]): string {
  switch (kind) {
    case "global_credit":
      return "Entrega global";
    case "player_deposit":
      return "Depósito";
    default:
      return kind;
  }
}

function statusBadge(
  status: WalletTransaction["status"],
): { tone: "success" | "info" | "danger" | "neutral"; label: string } {
  switch (status) {
    case "committed":
      return { tone: "success", label: "confirmado" };
    case "committed_recovered":
      return { tone: "info", label: "recuperado" };
    case "pending":
      return { tone: "neutral", label: "pendiente" };
    case "failed":
      return { tone: "danger", label: "fallido" };
  }
}

type Props = {
  casinoId: string;
  player: AuthUser;
  onClose: () => void;
};

export function PlayerTransactionsView({ casinoId, player, onClose }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [txs, setTxs] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { transactions } = await withAuth((t) =>
          apiListPlayerCasinoTransactions(t, casinoId, player.id),
        );
        if (!cancelled) setTxs(transactions);
      } catch (err) {
        if (cancelled) return;
        const e = err as ApiError;
        setError(e.message ?? "No se pudo cargar el historial");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [casinoId, player.id, withAuth]);

  const displayName = player.alias || player.fullName || player.matricula;

  return (
    <Card tone="night" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Badge tone="info">Historial</Badge>
        <h2 className="font-display text-2xl text-[--color-ivory]">
          {displayName}
        </h2>
        <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
          {loading ? "Cargando…" : `${txs.length} movimiento(s)`}
        </p>
      </div>

      {error && (
        <p
          className="font-label text-sm tracking-wider text-[--color-carmine-400]"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && !error && txs.length === 0 && (
        <p className="font-label text-sm text-[--color-cream]/70">
          Todavía no hay movimientos para este jugador en este casino.
        </p>
      )}

      {txs.length > 0 && (
        <ol className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
          {txs.map((t) => {
            const badge = statusBadge(t.status);
            const positive = t.delta >= 0;
            return (
              <li
                key={t.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm text-[--color-ivory]">
                      {kindLabel(t.kind)}
                    </span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                  <div className="mt-0.5 font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
                    {formatDateTime(t.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-display text-lg ${
                      positive
                        ? "text-[--color-chip-green-300]"
                        : "text-[--color-carmine-400]"
                    }`}
                  >
                    {positive ? "+" : ""}
                    {formatMxn(t.delta)}
                  </div>
                  {t.balanceAfter !== null && (
                    <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
                      saldo · {formatMxn(t.balanceAfter)}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Card>
  );
}
