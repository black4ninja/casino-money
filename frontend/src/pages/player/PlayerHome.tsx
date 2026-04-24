import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Balance } from "@/components/atoms/Balance";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import { apiListMyCasinos, type Casino } from "@/lib/casinoApi";
import { apiListMyCasinoMesas, type Mesa } from "@/lib/mesaApi";
import { apiGetMyCasinoSlotWallet } from "@/lib/slotsApi";
import { findGame, gameLabel } from "@/domain/games";

/**
 * /player/casino/:casinoId — the player has already authenticated and picked
 * a casino in /player. Alias editing lives in /player (the dashboard) so it's
 * a global setting, not per-casino.
 */
export default function PlayerHome() {
  const navigate = useNavigate();
  const { casinoId } = useParams<{ casinoId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [casino, setCasino] = useState<Casino | null>(null);
  const [casinoLoading, setCasinoLoading] = useState(true);
  const [casinoError, setCasinoError] = useState<string | null>(null);

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasLoading, setMesasLoading] = useState(true);

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

  // Load wallet balance for this casino. Reusa el endpoint /me/.../slots/wallet
  // que devuelve el saldo del jugador en este casino (fuente única para
  // cualquier juego que consuma/acredite fichas vía wallet).
  useEffect(() => {
    if (!casinoId || !casino) return;
    let cancelled = false;
    (async () => {
      setBalanceLoading(true);
      try {
        const wallet = await withAuth((t) =>
          apiGetMyCasinoSlotWallet(t, casinoId),
        );
        if (!cancelled) setBalance(wallet.balance);
      } catch {
        if (!cancelled) setBalance(0);
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [casinoId, casino, withAuth]);

  function handleEnterMesa(m: Mesa) {
    if (!casino) return;
    // The mesa view is nested under the casino URL so refreshes and shared
    // links keep both ids addressable without relying on router state.
    navigate(`/player/casino/${casino.id}/mesa/${m.id}`);
  }

  const title = casino?.name ?? (casinoLoading ? "Cargando…" : "Casino");

  return (
    <AppLayout
      title={title}
      subtitle={casino ? "Tu casino de esta noche" : undefined}
      back={{ to: "/player", label: "" }}
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
          </Card>

          <Card tone="night" className="flex flex-col items-center gap-1 py-6">
            <p className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/60">
              TU SALDO EN ESTE CASINO
            </p>
            {balanceLoading && balance === null ? (
              <span className="font-display text-3xl text-[--color-cream]/40">
                …
              </span>
            ) : (
              <Balance amount={balance ?? 0} size="lg" />
            )}
          </Card>

          <Card tone="night" className="flex flex-col gap-3">
            <h3 className="font-display text-xl text-[--color-ivory]">
              Diversión extra
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span aria-hidden className="text-2xl leading-none shrink-0">
                  🎰
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-[--color-ivory] truncate">
                    Tragamonedas
                  </div>
                </div>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={() =>
                  navigate(`/player/casino/${casino.id}/slots`)
                }
                className="w-full sm:w-auto"
              >
                Jugar →
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span aria-hidden className="text-2xl leading-none shrink-0">
                  🏁
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-[--color-ivory] truncate">
                    Carrera de Patrones
                  </div>
                  <div className="font-label text-[0.6rem] tracking-widest text-[--color-cream]/60">
                    Apuesta pasiva · corre sola cada 5 min
                  </div>
                </div>
              </div>
              <Button
                variant="info"
                size="sm"
                onClick={() =>
                  navigate(`/player/casino/${casino.id}/carrera`)
                }
                className="w-full sm:w-auto"
              >
                Apostar →
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
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          aria-hidden
                          className="text-2xl leading-none shrink-0"
                        >
                          {emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
                            Mesa {i + 1}
                          </div>
                          <div className="font-display text-lg text-[--color-ivory] truncate">
                            {gameLabel(m.gameType)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="onyx"
                        size="sm"
                        onClick={() => handleEnterMesa(m)}
                        className="w-full sm:w-auto"
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
