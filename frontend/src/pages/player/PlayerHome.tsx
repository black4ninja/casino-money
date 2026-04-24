import { useCallback, useEffect, useRef, useState } from "react";
import { usePolling } from "@/hooks/usePolling";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Balance } from "@/components/atoms/Balance";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import {
  apiClaimGreedyReward,
  apiListMyCasinos,
  type Casino,
} from "@/lib/casinoApi";
import { apiListMyCasinoMesas, type Mesa } from "@/lib/mesaApi";
import { apiGetMyCasinoSlotWallet } from "@/lib/slotsApi";
import {
  apiListActiveCasinoEvents,
  CASINO_EVENT_META,
  type CasinoEvent,
} from "@/lib/casinoEventsApi";
import { findGame, gameLabel } from "@/domain/games";
import { TransferToPlayerModal } from "@/components/organisms/TransferToPlayerModal";

/**
 * Pasos locales por click en el banner Greedy. Cuando el contador llega a
 * GREEDY_CLICKS_PER_REWARD, se cobra un crédito de +1 al servidor. Se usa un
 * entero en lugar de 0.01 en float para evitar imprecisión al acumular.
 */
const GREEDY_CLICKS_PER_REWARD = 100;

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

  // Eventos activos del casino (banner "Evento en curso"). Se actualizan en
  // vivo vía polling junto al saldo — el jugador no necesita recargar para
  // enterarse de que el maestro activó/desactivó un evento.
  const [activeEvents, setActiveEvents] = useState<CasinoEvent[]>([]);

  const [transferOpen, setTransferOpen] = useState(false);
  const [greedySpinKey, setGreedySpinKey] = useState(0);
  const [greedySpinning, setGreedySpinning] = useState(false);
  const [greedyClicks, setGreedyClicks] = useState(0);
  const [greedyError, setGreedyError] = useState<string | null>(null);
  // Evita disparar el crédito dos veces si el usuario clickea rápido mientras
  // la petición del décimo toque sigue en vuelo.
  const greedyClaimingRef = useRef(false);
  // Risa malvada al tocar el banner. El mini-juego premia clicks muy rápidos,
  // así que bloqueamos re-disparos mientras el audio está en curso para que
  // las reproducciones no se traslapen independientemente de la cadencia.
  const laughAudioRef = useRef<HTMLAudioElement | null>(null);
  const laughPlayingRef = useRef(false);

  useEffect(() => {
    const laugh = new Audio("/audio/greedy-laugh.mp3");
    laugh.preload = "auto";
    const clearFlag = () => {
      laughPlayingRef.current = false;
    };
    laugh.addEventListener("ended", clearFlag);
    laugh.addEventListener("error", clearFlag);
    laughAudioRef.current = laugh;
    return () => {
      laugh.removeEventListener("ended", clearFlag);
      laugh.removeEventListener("error", clearFlag);
      laugh.pause();
      laughAudioRef.current = null;
      laughPlayingRef.current = false;
    };
  }, []);

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
  const loadBalance = useCallback(async () => {
    if (!casinoId) return;
    setBalanceLoading(true);
    try {
      const wallet = await withAuth((t) =>
        apiGetMyCasinoSlotWallet(t, casinoId),
      );
      setBalance(wallet.balance);
    } catch {
      setBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, [casinoId, withAuth]);

  useEffect(() => {
    if (!casino) return;
    loadBalance();
  }, [casino, loadBalance]);

  const loadActiveEvents = useCallback(async () => {
    if (!casinoId) return;
    try {
      const { events } = await withAuth((t) =>
        apiListActiveCasinoEvents(t, casinoId),
      );
      setActiveEvents(events);
    } catch {
      setActiveEvents([]);
    }
  }, [casinoId, withAuth]);

  useEffect(() => {
    if (!casino) return;
    loadActiveEvents();
  }, [casino, loadActiveEvents]);

  // Auto-refresh ligero: mantiene el saldo en sync con lo que ocurra al
  // jugador fuera de esta vista (transferencias recibidas, venta de
  // subasta, depósitos del staff). 4s es suficientemente rápido para que
  // el jugador no perciba desfase y barato porque el endpoint del wallet
  // devuelve un solo documento.
  usePolling(loadBalance, { intervalMs: 4000, paused: !casino });
  // Mismo intervalo para los eventos — el maestro activa/desactiva y los
  // jugadores lo ven reflejado en el banner sin recargar.
  usePolling(loadActiveEvents, { intervalMs: 4000, paused: !casino });

  function handleEnterMesa(m: Mesa) {
    if (!casino) return;
    // The mesa view is nested under the casino URL so refreshes and shared
    // links keep both ids addressable without relying on router state.
    navigate(`/player/casino/${casino.id}/mesa/${m.id}`);
  }

  function playLaughIfIdle() {
    const audio = laughAudioRef.current;
    if (!audio) return;
    if (laughPlayingRef.current) return;
    laughPlayingRef.current = true;
    audio.currentTime = 0;
    audio.play().catch(() => {
      laughPlayingRef.current = false;
    });
  }

  function handleGreedyClick() {
    if (!casinoId) return;
    if (casino?.subastaActive) return;
    playLaughIfIdle();
    setGreedySpinKey((k) => k + 1);
    setGreedySpinning(true);
    setGreedyError(null);
    setGreedyClicks((prev) => {
      // Si ya estamos cobrando, clavamos el display en 1.00 mientras la red
      // responde — así el usuario ve "llegué" en vez de un reset instantáneo.
      if (greedyClaimingRef.current) return GREEDY_CLICKS_PER_REWARD;
      const next = prev + 1;
      if (next >= GREEDY_CLICKS_PER_REWARD) {
        greedyClaimingRef.current = true;
        // Un batchId por cobro. Si el POST falla, el usuario puede volver a
        // llegar a 100 y reintentar — el nuevo batchId evita colisionar con el
        // registro anterior, pero nada se duplica porque ese registro nunca
        // llegó a committed (o si llegó, el outcome.skipped lo refleja).
        const batchId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `greedy-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        withAuth((t) => apiClaimGreedyReward(t, casinoId, batchId))
          .then((r) => {
            setBalance(r.balance);
          })
          .catch((err) => {
            const e = err as ApiError;
            setGreedyError(e.message ?? "No se pudo cobrar el premio.");
          })
          .finally(() => {
            greedyClaimingRef.current = false;
            setGreedyClicks(0);
          });
        return GREEDY_CLICKS_PER_REWARD;
      }
      return next;
    });
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
          {casino.subastaActive && (
            <Card tone="night" className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Badge tone="gold">subasta en curso</Badge>
                <p className="font-label text-xs tracking-widest text-[--color-cream]/70">
                  Las operaciones de dinero están suspendidas mientras dura la
                  puja.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() =>
                  navigate(`/player/casino/${casino.id}/subasta`)
                }
              >
                Entrar a la puja
              </Button>
            </Card>
          )}

          {activeEvents.length > 0 && <EventsBanner events={activeEvents} />}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGreedyClick}
              disabled={casino.subastaActive}
              aria-label="Greedy — toca para acumular fichas"
              className="block w-full overflow-hidden rounded-2xl ring-2 ring-inset ring-[--color-gold-500]/40 shadow-[0_14px_40px_rgba(0,0,0,0.55)] transition hover:ring-[--color-gold-400] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[--color-gold-400]/70 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ perspective: "1200px" }}
            >
              <picture className="block">
                <source srcSet="/images/banners/greedy.avif" type="image/avif" />
                <source srcSet="/images/banners/greedy.webp" type="image/webp" />
                <img
                  key={`greedy-${greedySpinKey}`}
                  src="/images/banners/greedy.webp"
                  alt="Greedy — la casa siempre gana"
                  draggable={false}
                  loading="eager"
                  decoding="async"
                  onAnimationEnd={() => setGreedySpinning(false)}
                  className={[
                    "block h-auto w-full select-none",
                    greedySpinning ? "animate-card-twirl" : "",
                  ].join(" ")}
                  style={{ backfaceVisibility: "visible" }}
                />
              </picture>
            </button>

            <div
              className="flex flex-col gap-1 rounded-xl bg-[--color-smoke]/60 px-3 py-2 ring-1 ring-inset ring-[--color-gold-500]/25"
              aria-live="polite"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-label text-[0.6rem] uppercase tracking-[0.25em] text-[--color-cream]/70">
                  Fichas rotas de Greedy
                </span>
                <span className="font-display text-sm text-[--color-gold-300]">
                  {(greedyClicks / GREEDY_CLICKS_PER_REWARD).toFixed(2)} / 1.00
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[--color-felt-900]/70">
                <div
                  className="h-full bg-gradient-to-r from-[--color-gold-500] to-[--color-gold-300] transition-[width] duration-200"
                  style={{
                    width: `${(greedyClicks / GREEDY_CLICKS_PER_REWARD) * 100}%`,
                  }}
                />
              </div>
              {greedyError && (
                <p
                  className="font-label text-[0.65rem] tracking-wider text-[--color-carmine-400]"
                  role="alert"
                >
                  {greedyError}
                </p>
              )}
            </div>
          </div>

          <Card tone="night" className="flex flex-col items-center gap-3 py-6">
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
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setTransferOpen(true)}
                disabled={!balance || balance <= 0}
              >
                Transferir a otro jugador
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadBalance}
                disabled={balanceLoading}
                aria-label="Actualizar saldo"
                title="Refrescar saldo"
              >
                {balanceLoading ? "Actualizando…" : "↻ Actualizar"}
              </Button>
            </div>
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
                disabled={casino.subastaActive}
                title={
                  casino.subastaActive
                    ? "Pausado durante la subasta"
                    : undefined
                }
              >
                {casino.subastaActive ? "Pausado" : "Jugar"}
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
                disabled={casino.subastaActive}
                title={
                  casino.subastaActive
                    ? "Pausado durante la subasta"
                    : undefined
                }
                onClick={() =>
                  navigate(`/player/casino/${casino.id}/carrera`)
                }
                className="w-full sm:w-auto"
              >
                Apostar
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
                        ¡A la mesa!
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}

      {casino && (
        <TransferToPlayerModal
          open={transferOpen}
          casinoId={casino.id}
          senderBalance={balance ?? 0}
          onClose={() => setTransferOpen(false)}
          onTransferred={(newBalance) => setBalance(newBalance)}
        />
      )}
    </AppLayout>
  );
}

/**
 * Banner de eventos en curso — arriba de la imagen de Greedy. Lista uno o más
 * eventos activos con el nombre definido por el maestro y una línea corta
 * que explica el efecto. Aparece/desaparece en vivo por polling: el jugador
 * no necesita recargar cuando el maestro activa/desactiva un evento.
 */
function EventsBanner({ events }: { events: CasinoEvent[] }) {
  return (
    <Card tone="gold" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge tone="gold">evento en curso</Badge>
        <span
          className="font-label text-xs tracking-widest text-[--color-cream]/80"
          aria-live="polite"
        >
          {events.length === 1
            ? "Un evento activo afecta tus transacciones"
            : `${events.length} eventos activos afectan tus transacciones`}
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        {events.map((ev) => {
          const meta = CASINO_EVENT_META[ev.type];
          return (
            <li
              key={ev.id}
              className="flex items-start gap-3 rounded-xl bg-[--color-smoke]/60 px-3 py-2 ring-1 ring-inset ring-[--color-gold-500]/30"
            >
              <span aria-hidden className="text-2xl leading-none shrink-0">
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-lg text-[--color-ivory] truncate">
                    {ev.name}
                  </span>
                  <Badge tone={meta.tone} size="sm">
                    {meta.shortLabel}
                  </Badge>
                </div>
                <p className="font-label text-xs text-[--color-cream]/75 mt-0.5">
                  {meta.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
