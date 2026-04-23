import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiListMyMesas, type MyMesa } from "@/lib/mesaApi";
import { findGame } from "@/domain/games";

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
    <AppLayout
      title="Tallador"
      right={
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Salir
        </Button>
      }
    >
      <Card tone="felt">
        <div className="flex flex-col gap-2">
          <Badge tone="info">TALLADOR</Badge>
          <h2 className="font-display text-2xl text-[--color-ivory]">
            Bienvenido{user?.fullName ? `, ${user.fullName}` : ""}
          </h2>
          <p className="font-mono text-xs text-[--color-cream]/60">
            Matrícula: {user?.matricula} · Rol: {user?.role}
          </p>
        </div>
      </Card>

      <MyMesasSection
        mesas={myMesas}
        loading={mesasLoading}
        error={mesasError}
      />

      <Card tone="night">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={() => {
              if (myMesas.length === 0) return;
              navigate(`/dealer/mesa/${myMesas[0].id}`);
            }}
            disabled={mesasLoading || myMesas.length === 0}
            title={
              myMesas.length === 0 && !mesasLoading
                ? "Aún no tienes mesas asignadas"
                : undefined
            }
          >
            Abrir mesa
          </Button>
          <Button variant="info" onClick={() => navigate("/dealer/stats")}>
            Ver estadísticas de mesa
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}

type MyMesasSectionProps = {
  mesas: MyMesa[];
  loading: boolean;
  error: string | null;
};

function MyMesasSection({ mesas, loading, error }: MyMesasSectionProps) {
  return (
    <Card tone="night" className="flex flex-col gap-3">
      <div>
        <h3 className="font-display text-lg text-[--color-ivory]">
          Mis mesas asignadas
        </h3>
        <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
          {loading
            ? "Consultando asignaciones…"
            : mesas.length === 1
              ? "1 mesa"
              : `${mesas.length} mesas`}
        </p>
      </div>

      {error && (
        <p
          className="font-label text-xs tracking-wider text-[--color-carmine-400]"
          role="alert"
        >
          {error}
        </p>
      )}

      {!loading && !error && mesas.length === 0 && (
        <p className="font-label text-sm text-[--color-cream]/70">
          Aún no tienes mesas asignadas. Pídele al maestro que te asigne una
          para esta jornada.
        </p>
      )}

      {!loading && mesas.length > 0 && (
        <ol className="flex flex-col gap-2">
          {mesas.map((m) => (
            <MyMesaRow key={m.id} mesa={m} />
          ))}
        </ol>
      )}
    </Card>
  );
}

function MyMesaRow({ mesa }: { mesa: MyMesa }) {
  const navigate = useNavigate();
  const game = findGame(mesa.gameType);
  const label = game?.name ?? mesa.gameType;
  const emoji = game?.emoji ?? "◆";
  const casinoArchived = !mesa.casino.active;
  const mesaArchived = !mesa.active;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-[--color-smoke]/70 px-4 py-3 ring-1 ring-inset ring-white/5">
      <span aria-hidden className="text-2xl leading-none shrink-0">
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
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
          Fecha del evento · {formatDate(mesa.casino.date)}
        </div>
      </div>
      <div className="shrink-0">
        <Button
          variant="gold"
          size="sm"
          onClick={() => navigate(`/dealer/mesa/${mesa.id}`)}
        >
          Abrir
        </Button>
      </div>
    </li>
  );
}
