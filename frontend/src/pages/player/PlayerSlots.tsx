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

  useEffect(() => {
    if (!casinoId) {
      navigate("/player", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { casinos } = await withAuth((t) => apiListMyCasinos(t));
        if (cancelled) return;
        const found = casinos.find((c) => c.id === casinoId);
        if (!found) {
          setError("Este casino no está disponible para ti en este momento.");
          setCasino(null);
          return;
        }
        setCasino(found);

        const wallet = await withAuth((t) =>
          apiGetMyCasinoSlotWallet(t, casinoId),
        );
        if (!cancelled) setBalance(wallet.balance);
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
  }, [casinoId, navigate, withAuth]);

  const title = casino?.name ?? (loading ? "Cargando…" : "Tragamonedas");

  return (
    <AppLayout
      title={title}
      subtitle="Tragamonedas de patrones"
      back={{ to: `/player/casino/${casinoId ?? ""}`, label: "" }}
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
              onClick={() => navigate(`/player/casino/${casinoId ?? ""}`, { replace: true })}
            >
              ← Volver
            </Button>
          </div>
        </Card>
      )}

      {!error && casino && balance !== null && (
        <SlotMachineGameView casinoId={casino.id} initialBalance={balance} />
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
