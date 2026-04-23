import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { useAuthStore } from "@/stores/authStore";
import { apiListMyCasinos, type Casino } from "@/lib/casinoApi";
import type { ApiError } from "@/lib/authApi";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refresh);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);

  const [casinos, setCasinos] = useState<Casino[]>([]);
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

  const loadCasinos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { casinos } = await withAuth((t) => apiListMyCasinos(t));
      setCasinos(casinos);
    } catch (err) {
      const e = err as ApiError;
      setError(e.message ?? "No se pudieron cargar los casinos.");
    } finally {
      setLoading(false);
    }
  }, [withAuth]);

  useEffect(() => {
    loadCasinos();
  }, [loadCasinos]);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <AppLayout
      title="Jugador"
      right={
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Salir
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Card tone="felt">
          <div className="flex flex-col gap-2">
            <Badge tone="felt">JUGADOR</Badge>
            <h2 className="font-display text-2xl text-[--color-ivory]">
              Bienvenido{user?.fullName ? `, ${user.fullName}` : ""}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[--color-cream]/70">
              <span className="font-mono">{user?.matricula}</span>
              {user?.departamento && (
                <>
                  <span aria-hidden>·</span>
                  <span>{user.departamento}</span>
                </>
              )}
            </div>
          </div>
        </Card>

        <Card tone="night" className="flex flex-col gap-3">
          <div>
            <h3 className="font-display text-xl text-[--color-ivory]">
              Mis casinos
            </h3>
            <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
              {loading
                ? "Cargando…"
                : `${casinos.length} evento(s) disponible(s)`}
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

          {!loading && !error && casinos.length === 0 && (
            <p className="font-label text-sm text-[--color-cream]/70">
              {user?.departamento
                ? `Aún no hay casinos disponibles para ${user.departamento}. Revisa más tarde.`
                : "Tu cuenta no tiene un departamento asignado; pide a tu maestro que lo configure para ver casinos."}
            </p>
          )}

          {casinos.length > 0 && (
            <ul className="flex flex-col gap-2">
              {casinos.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg text-[--color-ivory] truncate">
                      {c.name}
                    </div>
                    <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55 mt-0.5">
                      {formatDate(c.date)}
                    </div>
                  </div>
                  <Button
                    variant="onyx"
                    size="sm"
                    onClick={() => navigate(`/player/casino/${c.id}`)}
                  >
                    ¡A la mesa! →
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
