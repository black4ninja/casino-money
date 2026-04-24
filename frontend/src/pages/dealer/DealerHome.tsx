import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiListMyMesas, type MyMesa } from "@/lib/mesaApi";
import { apiGetMyCasinoSlotWallet } from "@/lib/slotsApi";
import { findGame } from "@/domain/games";
import { formatMxn } from "@/components/molecules/AmountPicker";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function DealerHome() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);
  const logout = useAuthStore((s) => s.logout);

  const [myMesas, setMyMesas] = useState<MyMesa[]>([]);
  const [mesasLoading, setMesasLoading] = useState(true);
  const [mesasError, setMesasError] = useState<string | null>(null);

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
    setMesasLoading(true);
    setMesasError(null);
    withAuth((t) => apiListMyMesas(t))
      .then(({ mesas }) => {
        if (!cancelled) setMyMesas(mesas);
      })
      .catch((err: ApiError) => {
        if (cancelled) return;
        setMesasError(err.message ?? "No se pudieron cargar tus mesas.");
      })
      .finally(() => {
        if (!cancelled) setMesasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [withAuth]);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <AppLayout title="Dealer">
      <div className="flex flex-col gap-4">
        <Card tone="felt">
          <div className="flex flex-col gap-2">
            <Badge tone="info">DEALER</Badge>
            <h2 className="font-display text-2xl text-[--color-ivory]">
              Bienvenido{user?.fullName ? `, ${user.fullName}` : ""}
            </h2>
          </div>
        </Card>

        <div className="flex flex-col gap-3 px-4">
          <h3 className="font-display text-xl text-[--color-ivory]">
            Mis mesas asignadas
          </h3>
          <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
            {mesasLoading
              ? "Consultando asignaciones…"
              : mesasError
                ? "—"
                : myMesas.length === 1
                  ? "1 mesa"
                  : `${myMesas.length} mesas`}
          </p>
        </div>

        {mesasError && (
          <p
            className="font-label text-xs tracking-wider text-[--color-chip-red-300] px-4"
            role="alert"
          >
            {mesasError}
          </p>
        )}

        {!mesasLoading && !mesasError && myMesas.length === 0 && (
          <Card tone="night">
            <p className="font-label text-sm text-[--color-cream]/70">
              Aún no tienes mesas asignadas. Pídele al maestro que te asigne
              una para esta jornada.
            </p>
          </Card>
        )}

        {!mesasLoading &&
          myMesas.map((m) => (
            <MyMesaCard key={m.id} mesa={m} withAuth={withAuth} />
          ))}

        <div className="mt-8 px-4 pb-4">
          <Button
            variant="danger"
            size="md"
            block
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function MyMesaCard({
  mesa,
  withAuth,
}: {
  mesa: MyMesa;
  withAuth: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
}) {
  const navigate = useNavigate();
  const game = findGame(mesa.gameType);
  const label = game?.name ?? mesa.gameType;
  const emoji = game?.emoji ?? "◆";
  const casinoArchived = !mesa.casino.active;
  const mesaArchived = !mesa.active;

  // Saldo personal del dealer en este casino (alimentado por las comisiones
  // del 20% de cada cobro que ejecuta). Se consulta al endpoint genérico
  // de wallet (role-agnostic) para no duplicar backend.
  const [balance, setBalance] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    withAuth((t) => apiGetMyCasinoSlotWallet(t, mesa.casino.id))
      .then((r) => {
        if (!cancelled) setBalance(r.balance);
      })
      .catch(() => {
        // Silencioso: si falla el fetch del saldo, no bloqueamos la card.
      });
    return () => {
      cancelled = true;
    };
  }, [mesa.casino.id, withAuth]);

  return (
    <Card
      tone="night"
      className="flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span aria-hidden className="text-2xl leading-none shrink-0">
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
              {mesa.casino.name}
            </span>
            {casinoArchived && <Badge tone="danger">casino archivado</Badge>}
            {mesaArchived && !casinoArchived && (
              <Badge tone="danger">mesa archivada</Badge>
            )}
          </div>
          <div className="font-display text-lg text-[--color-ivory] truncate">
            {label}
          </div>
          <div className="font-label text-xs tracking-wider text-[--color-cream]/60">
            {formatDate(mesa.casino.date)}
          </div>
          {balance !== null && (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-label text-[0.6rem] tracking-[0.3em] text-[--color-cream]/55">
                Mis comisiones
              </span>
              <span className="font-display text-base text-[--color-gold-300]">
                {formatMxn(balance)}
              </span>
            </div>
          )}
        </div>
      </div>
      <Button
        variant="gold"
        size="sm"
        onClick={() => navigate(`/dealer/mesa/${mesa.id}`)}
        className="w-full sm:w-auto"
      >
        Abrir →
      </Button>
    </Card>
  );
}
