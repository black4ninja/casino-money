import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { useAuthStore } from "@/stores/authStore";
import { apiListMyCasinos, type Casino } from "@/lib/casinoApi";
import { apiUpdateMyAlias, type ApiError } from "@/lib/authApi";

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
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [alias, setAlias] = useState(user?.alias ?? "");
  const [savingAlias, setSavingAlias] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [aliasInfo, setAliasInfo] = useState<string | null>(null);

  // Sync input with store updates (e.g. another tab saved a new alias).
  useEffect(() => {
    setAlias(user?.alias ?? "");
  }, [user?.alias]);

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

  const trimmedAlias = alias.trim();
  const currentAlias = user?.alias ?? "";
  const aliasDirty = trimmedAlias !== currentAlias;
  const aliasInvalid = trimmedAlias.length > 0 && trimmedAlias.length < 2;

  async function handleSaveAlias() {
    if (savingAlias || !aliasDirty || aliasInvalid) return;
    setSavingAlias(true);
    setAliasError(null);
    setAliasInfo(null);
    try {
      const { user: updated } = await withAuth((t) =>
        apiUpdateMyAlias(
          t,
          trimmedAlias.length === 0 ? null : trimmedAlias,
        ),
      );
      setUser(updated);
      setAliasInfo(
        trimmedAlias.length === 0 ? "Alias removido" : "Alias actualizado",
      );
    } catch (err) {
      const e = err as ApiError;
      setAliasError(e.message ?? "No se pudo actualizar el alias");
    } finally {
      setSavingAlias(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <AppLayout title="Jugador">
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
          <h3 className="font-display text-xl text-[--color-ivory]">
            Tu alias
          </h3>

          <Input
            value={alias}
            onChange={(e) => {
              setAlias(e.target.value);
              setAliasInfo(null);
              setAliasError(null);
            }}
            placeholder={user?.fullName ?? "Ej. Ana, Beto…"}
            maxLength={24}
            error={aliasInvalid ? "Escribe al menos 2 caracteres" : undefined}
          />

          {aliasError && (
            <p
              className="font-label text-xs tracking-wider text-[--color-carmine-400]"
              role="alert"
            >
              {aliasError}
            </p>
          )}
          {aliasInfo && !aliasError && (
            <p className="font-label text-xs tracking-wider text-[--color-gold-300]">
              {aliasInfo}
            </p>
          )}

          <Button
            variant="info"
            size="sm"
            onClick={handleSaveAlias}
            disabled={savingAlias || !aliasDirty || aliasInvalid}
            className="w-full sm:w-auto sm:self-start"
          >
            {savingAlias ? "Guardando…" : "Guardar alias"}
          </Button>
        </Card>

        {/* "Mis casinos" va dentro de un Card para que el heading respete
            la misma rejilla horizontal que el resto (el Card atom trae mx-4;
            un heading suelto con px-4 quedaba mal alineado en viewports
            amplios donde el main tiene más padding horizontal). */}
        <Card tone="night" className="flex flex-col gap-4">
          <div>
            <h3 className="font-display text-xl text-[--color-ivory]">
              Mis casinos
            </h3>
            <p className="mt-1 font-label text-xs tracking-widest text-[--color-cream]/60">
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
            <ul className="flex flex-col gap-3">
              {casinos.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl bg-[--color-smoke]/70 px-5 py-4 sm:flex-row sm:items-center"
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
                    className="w-full sm:w-auto"
                  >
                    ¡Pasa al salón! →
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Logout sale del patrón de listado: va en su propio Card tone="night"
            para respetar la misma rejilla (mx-4) que el resto y no quedar
            flush con los bordes. */}
        <Card tone="night" className="mt-4">
          <Button
            variant="danger"
            size="md"
            block
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
