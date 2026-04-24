import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { SlotMachineGameView } from "@/components/organisms/games/SlotMachineGameView";
import { useAuthStore } from "@/stores/authStore";
import { apiListMyCasinos, type Casino } from "@/lib/casinoApi";
import { apiGetMyCasinoSlotWallet } from "@/lib/slotsApi";
import type { ApiError } from "@/lib/authApi";

/**
 * /player/casino/:casinoId/slots — tragamonedas personal del jugador dentro
 * de un casino específico. Valida acceso al casino (igual patrón que
 * PlayerHome), trae el saldo inicial del wallet y monta SlotMachineGameView.
 */
export default function PlayerSlots() {
  const navigate = useNavigate();
  const { casinoId } = useParams<{ casinoId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);
  const role = useAuthStore((s) => s.user?.role);
  // Los dealers acceden al mismo juego pero su "home" es /dealer — el botón de
  // volver y los redirects de error deben llevarlos allá en vez de al
  // PlayerHome (que ni siquiera les abre por route guard).
  const backTo =
    role === "dealer" ? "/dealer" : `/player/casino/${casinoId ?? ""}`;

  const [casino, setCasino] = useState<Casino | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

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

  // Bootstrap: trae el saldo directamente. La validación de acceso la hace el
  // backend via requireAuthMw sobre el endpoint de wallet — si el usuario no
  // tiene acceso, devuelve error y lo mostramos. El nombre del casino se
  // intenta resolver en paralelo (best-effort) sólo para mejorar el título;
  // si no llega no bloquea nada. Así evitamos depender de apiListMyCasinos,
  // que tiene filtros por rol que complicaban el flujo del dealer.
  useEffect(() => {
    if (!casinoId) {
      navigate(role === "dealer" ? "/dealer" : "/player", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const wallet = await withAuth((t) =>
          apiGetMyCasinoSlotWallet(t, casinoId),
        );
        if (cancelled) return;
        setBalance(wallet.balance);

        void withAuth((t) => apiListMyCasinos(t))
          .then(({ casinos }) => {
            if (cancelled) return;
            const found = casinos.find((c) => c.id === casinoId);
            if (found) setCasino(found);
          })
          .catch(() => {
            /* noop — el título cae al fallback. */
          });
      } catch (err) {
        if (cancelled) return;
        const e = err as ApiError;
        setError(e.message ?? "No se pudo cargar la tragamonedas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [casinoId, navigate, withAuth, role]);

  const title = casino?.name ?? (loading ? "Cargando…" : "Tragamonedas");

  return (
    <AppLayout
      title={title}
      subtitle="Tragamonedas de patrones"
      back={{ to: backTo, label: "" }}
    >
      {error && (
        <Card tone="night">
          <p
            role="alert"
            className="font-label text-sm tracking-wider text-[--color-chip-red-300]"
          >
            {error}
          </p>
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(backTo, { replace: true })}
            >
              ← Volver
            </Button>
          </div>
        </Card>
      )}

      {!error && casinoId && balance !== null && (
        <SlotMachineGameView casinoId={casinoId} initialBalance={balance} />
      )}

      {!error && (loading || balance === null) && (
        <Card tone="night">
          <p className="font-label text-sm tracking-wider text-[--color-cream]/70">
            Preparando la máquina…
          </p>
        </Card>
      )}
    </AppLayout>
  );
}
