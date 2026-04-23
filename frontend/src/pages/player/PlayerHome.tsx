import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { useAuthStore } from "@/stores/authStore";
import { apiUpdateMyAlias, type ApiError } from "@/lib/authApi";
import { apiListMyCasinos, type Casino } from "@/lib/casinoApi";
import { apiListMyCasinoMesas, type Mesa } from "@/lib/mesaApi";
import { findGame, gameLabel } from "@/domain/games";

/**
 * /player/casino/:casinoId — the player has already authenticated and picked
 * a casino in /player, so we no longer ask them to scan a session QR or type
 * a session code: we know who they are and where they are. The casino id
 * lives in the URL so the page is refreshable, shareable, and doesn't rely
 * on React Router state that would be lost on reload.
 *
 * The player CAN still edit their alias (playful in-game name), which now
 * persists to the backend as `AppUser.alias` via PATCH /me/alias — separate
 * from the school-of-record `fullName`.
 */
export default function PlayerHome() {
  const navigate = useNavigate();
  const { casinoId } = useParams<{ casinoId: string }>();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);
  const setUser = useAuthStore((s) => s.setUser);

  const [casino, setCasino] = useState<Casino | null>(null);
  const [casinoLoading, setCasinoLoading] = useState(true);
  const [casinoError, setCasinoError] = useState<string | null>(null);

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasLoading, setMesasLoading] = useState(true);

  const [alias, setAlias] = useState(user?.alias ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

  // Verify access by fetching the caller's casinos and finding a match.
  // This doubles as an authorization check: if the id isn't in the list,
  // the player isn't allowed here and we bounce them back.
  useEffect(() => {
    if (!casinoId) {
      navigate("/player", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      setCasinoLoading(true);
      setCasinoError(null);
      try {
        const { casinos } = await withAuth((t) => apiListMyCasinos(t));
        if (cancelled) return;
        const found = casinos.find((c) => c.id === casinoId);
        if (!found) {
          setCasinoError(
            "Este casino no está disponible para ti en este momento.",
          );
          setCasino(null);
          return;
        }
        setCasino(found);
      } catch (err) {
        if (cancelled) return;
        const e = err as ApiError;
        setCasinoError(e.message ?? "No se pudo cargar el casino.");
      } finally {
        if (!cancelled) setCasinoLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [casinoId, navigate, withAuth]);

  // Load mesas once we've confirmed the player has access to this casino.
  // Runs after the casino-access check above — that way a player who has no
  // right to be here never triggers a mesas query for somebody else's casino.
  useEffect(() => {
    if (!casinoId || !casino) return;
    let cancelled = false;
    (async () => {
      setMesasLoading(true);
      try {
        const { mesas } = await withAuth((t) =>
          apiListMyCasinoMesas(t, casinoId),
        );
        if (!cancelled) setMesas(mesas);
      } catch {
        if (!cancelled) setMesas([]);
      } finally {
        if (!cancelled) setMesasLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [casinoId, casino, withAuth]);

  const trimmed = alias.trim();
  const currentAlias = user?.alias ?? "";
  const dirty = trimmed !== currentAlias;
  const aliasInvalid = trimmed.length > 0 && trimmed.length < 2;

  async function handleSaveAlias() {
    if (saving || !dirty || aliasInvalid) return;
    setSaving(true);
    setError(null);
    setInfo(null);
    try {
      const { user: updated } = await withAuth((t) =>
        apiUpdateMyAlias(t, trimmed.length === 0 ? null : trimmed),
      );
      setUser(updated);
      setInfo(trimmed.length === 0 ? "Alias removido" : "Alias actualizado");
    } catch (err) {
      const e = err as ApiError;
      setError(e.message ?? "No se pudo actualizar el alias");
    } finally {
      setSaving(false);
    }
  }

  function handleEnterMesa(m: Mesa) {
    if (!casino) return;
    // The mesa view is nested under the casino URL so refreshes and shared
    // links keep both ids addressable without relying on router state.
    navigate(`/player/casino/${casino.id}/mesa/${m.id}`);
  }

  const displayName = useMemo(
    () => currentAlias || user?.fullName || user?.matricula || "Jugador",
    [currentAlias, user?.fullName, user?.matricula],
  );

  const title = casino?.name ?? (casinoLoading ? "Cargando…" : "Casino");

  return (
    <AppLayout
      title={title}
      subtitle={casino ? "Tu casino de esta noche" : undefined}
      back={{ to: "/player", label: "Mis casinos" }}
    >
      {casinoError && (
        <Card tone="night">
          <p
            className="font-label text-sm tracking-wider text-[--color-carmine-400]"
            role="alert"
          >
            {casinoError}
          </p>
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/player", { replace: true })}
            >
              ← Volver a mis casinos
            </Button>
          </div>
        </Card>
      )}

      {casino && (
        <>
          <Card tone="felt" className="flex flex-col gap-2">
            <Badge tone="gold">AQUÍ JUEGAS</Badge>
            <h2 className="font-display text-2xl text-[--color-ivory]">
              {casino.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[--color-cream]/70">
              <span className="font-mono">{user?.matricula}</span>
              {user?.departamento && (
                <>
                  <span aria-hidden>·</span>
                  <span>{user.departamento}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span className="text-[--color-gold-300]">{displayName}</span>
            </div>
          </Card>

          <Card tone="night" className="flex flex-col gap-3">
            <div>
              <h3 className="font-display text-xl text-[--color-ivory]">
                Tu alias
              </h3>
              <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                Cómo quieres que te vean en la mesa. Se queda guardado para la
                próxima vez que juegues.
              </p>
            </div>

            <Input
              value={alias}
              onChange={(e) => {
                setAlias(e.target.value);
                setInfo(null);
                setError(null);
              }}
              placeholder={user?.fullName ?? "Ej. Ana, Beto…"}
              maxLength={24}
              hint={
                aliasInvalid
                  ? undefined
                  : "Mínimo 2 caracteres. Déjalo vacío para usar tu nombre."
              }
              error={aliasInvalid ? "Escribe al menos 2 caracteres" : undefined}
            />

            {error && (
              <p
                className="font-label text-xs tracking-wider text-[--color-carmine-400]"
                role="alert"
              >
                {error}
              </p>
            )}
            {info && !error && (
              <p className="font-label text-xs tracking-wider text-[--color-gold-300]">
                {info}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="info"
                size="sm"
                onClick={handleSaveAlias}
                disabled={saving || !dirty || aliasInvalid}
              >
                {saving ? "Guardando…" : "Guardar alias"}
              </Button>
              {currentAlias && alias === currentAlias && (
                <span className="font-label text-xs tracking-widest text-[--color-cream]/50">
                  Alias actual: {currentAlias}
                </span>
              )}
            </div>
          </Card>

          <Card tone="night" className="flex flex-col gap-3">
            <div>
              <h3 className="font-display text-xl text-[--color-ivory]">
                Diversión extra
              </h3>
              <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                Personal y en solitario — juega con tu saldo del casino.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5">
              <span aria-hidden className="text-2xl leading-none shrink-0">
                🎰
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
                  TRAGAMONEDAS
                </div>
                <div className="font-display text-lg text-[--color-ivory] truncate">
                  Patrones & Anti-Patrones
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() =>
                  navigate(`/player/casino/${casino.id}/slots`)
                }
              >
                Jugar →
              </Button>
            </div>
          </Card>

          <Card tone="night" className="flex flex-col gap-3">
            <div>
              <h3 className="font-display text-xl text-[--color-ivory]">
                Mesas
              </h3>
              <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                {mesasLoading
                  ? "Cargando mesas…"
                  : mesas.length === 0
                    ? "Aún no hay mesas abiertas"
                    : `${mesas.length} mesa(s) disponible(s)`}
              </p>
            </div>

            {!mesasLoading && mesas.length === 0 && (
              <p className="font-label text-sm text-[--color-cream]/70">
                Vuelve más tarde — el maestro aún no abre mesas en este casino.
              </p>
            )}

            {mesas.length > 0 && (
              <ul className="flex flex-col gap-2">
                {mesas.map((m, i) => {
                  const game = findGame(m.gameType);
                  const emoji = game?.emoji ?? "◆";
                  return (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5"
                    >
                      <span
                        aria-hidden
                        className="text-2xl leading-none shrink-0"
                      >
                        {emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
                          Mesa {i + 1}
                        </div>
                        <div className="font-display text-lg text-[--color-ivory] truncate">
                          {gameLabel(m.gameType)}
                        </div>
                      </div>
                      <Button
                        variant="onyx"
                        size="sm"
                        onClick={() => handleEnterMesa(m)}
                      >
                        ¡A la mesa! →
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </AppLayout>
  );
}
