import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Balance } from "@/components/atoms/Balance";
import { PatternRaceView } from "@/components/organisms/games/PatternRaceView";
import { useAuthStore } from "@/stores/authStore";
import { apiListMyCasinos, type Casino } from "@/lib/casinoApi";
import { apiGetMyCasinoSlotWallet } from "@/lib/slotsApi";
import {
  apiGetPatternRaceCurrent,
  apiListMyPatternRaceBets,
  apiPlacePatternRaceBet,
  type PatternRaceBetPayload,
  type PatternRaceContestantPayload,
  type PatternRaceSnapshot,
} from "@/lib/carreraApi";
import type { ApiError } from "@/lib/authApi";
import {
  BET_KIND_HINT,
  BET_KIND_LABEL,
  CARRERA_BET_LEVELS,
  type CarreraBetLevel,
  type PatternRaceBetKind,
} from "@/domain/patternRace";

/**
 * /player/casino/:casinoId/carrera — vista para apostar en la Carrera de
 * Patrones desde el móvil. Reutiliza el organism PatternRaceView en modo
 * compact para que el jugador vea la pista, y agrega un panel de apuesta.
 */
export default function PlayerCarrera() {
  const navigate = useNavigate();
  const { casinoId } = useParams<{ casinoId: string }>();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [casino, setCasino] = useState<Casino | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PatternRaceSnapshot | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [myBets, setMyBets] = useState<PatternRaceBetPayload[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [betKind, setBetKind] = useState<PatternRaceBetKind>("win");
  const [amount, setAmount] = useState<CarreraBetLevel>(CARRERA_BET_LEVELS[0]);
  const [betError, setBetError] = useState<string | null>(null);
  const [betSuccess, setBetSuccess] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const aliveRef = useRef(true);

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

  // Bootstrap: verificar acceso al casino + estado inicial.
  useEffect(() => {
    if (!casinoId) {
      navigate("/player", { replace: true });
      return;
    }
    aliveRef.current = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { casinos } = await withAuth((t) => apiListMyCasinos(t));
        if (!aliveRef.current) return;
        const found = casinos.find((c) => c.id === casinoId);
        if (!found) {
          setError("Este casino no está disponible para ti en este momento.");
          return;
        }
        setCasino(found);

        const [wallet, snap, bets] = await Promise.all([
          withAuth((t) => apiGetMyCasinoSlotWallet(t, casinoId)),
          apiGetPatternRaceCurrent(casinoId),
          withAuth((t) => apiListMyPatternRaceBets(t, casinoId, 20)),
        ]);
        if (!aliveRef.current) return;
        setBalance(wallet.balance);
        setSnapshot(snap);
        setMyBets(bets.bets);
      } catch (err) {
        if (!aliveRef.current) return;
        const e = err as ApiError;
        setError(e.message ?? "No se pudo cargar la carrera.");
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    })();
    return () => {
      aliveRef.current = false;
    };
  }, [casinoId, navigate, withAuth]);

  // Poll del snapshot cada 2s para mantener la pista viva.
  useEffect(() => {
    if (!casinoId || !snapshot) return;
    let timer: number | null = null;
    const tick = async () => {
      try {
        const snap = await apiGetPatternRaceCurrent(casinoId);
        if (!aliveRef.current) return;
        setSnapshot((prev) => {
          // Cuando cambia el ciclo, recargamos también mis apuestas (acaban
          // de resolverse) y el saldo.
          if (prev && prev.current.cycleIndex !== snap.current.cycleIndex) {
            void refreshMyBetsAndBalance();
          }
          return snap;
        });
      } catch {
        // Silencioso: reintentamos en el siguiente tick.
      } finally {
        if (aliveRef.current) timer = window.setTimeout(tick, 2000);
      }
    };
    timer = window.setTimeout(tick, 2000);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
    };
    // refreshMyBetsAndBalance es estable respecto a casinoId; no hace falta
    // en deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casinoId, snapshot]);

  const refreshMyBetsAndBalance = useCallback(async () => {
    if (!casinoId) return;
    try {
      const [bets, wallet] = await Promise.all([
        withAuth((t) => apiListMyPatternRaceBets(t, casinoId, 20)),
        withAuth((t) => apiGetMyCasinoSlotWallet(t, casinoId)),
      ]);
      if (!aliveRef.current) return;
      setMyBets(bets.bets);
      setBalance(wallet.balance);
    } catch {
      // Ignorado; próxima actualización lo recoge.
    }
  }, [casinoId, withAuth]);

  const contestants: PatternRaceContestantPayload[] =
    snapshot?.current.contestants ?? [];
  const canBet = snapshot?.phase === "betting";

  const handlePlace = useCallback(async () => {
    if (!casinoId || !selectedPattern || !canBet) return;
    setBetError(null);
    setBetSuccess(null);
    setPlacing(true);
    try {
      const betBatchId = crypto.randomUUID();
      const res = await withAuth((t) =>
        apiPlacePatternRaceBet(t, casinoId, {
          patternId: selectedPattern,
          betKind,
          amount,
          betBatchId,
        }),
      );
      setBalance(res.balanceAfter);
      setMyBets((prev) => [res.bet, ...prev.filter((b) => b.id !== res.bet.id)]);
      const contestantLabel =
        contestants.find((c) => c.patternId === selectedPattern)?.label ??
        selectedPattern;
      setBetSuccess(
        `Apuesta registrada: $${amount} a ${contestantLabel} (${BET_KIND_LABEL[betKind]}).`,
      );
      setSelectedPattern(null);
    } catch (err) {
      const e = err as ApiError;
      setBetError(e.message ?? "No se pudo colocar la apuesta.");
    } finally {
      setPlacing(false);
    }
  }, [amount, betKind, canBet, casinoId, contestants, selectedPattern, withAuth]);

  const currentCycleBets = useMemo(() => {
    if (!snapshot) return [];
    return myBets.filter((b) => b.cycleIndex === snapshot.current.cycleIndex);
  }, [myBets, snapshot]);
  const previousCycleBets = useMemo(() => {
    if (!snapshot) return [];
    return myBets.filter((b) => b.cycleIndex !== snapshot.current.cycleIndex);
  }, [myBets, snapshot]);

  // Bloqueo de monto: una vez que el jugador apostó en este ciclo, el monto
  // queda fijo. Cualquier apuesta adicional del mismo ciclo (hasta 3 por el
  // rate-limit del backend) reusa ese mismo monto. La apuesta ya colocada es
  // irrevocable; la UI debe reflejarlo. Se desbloquea solo cuando cambia de
  // ciclo (el useEffect de polling ya reemplaza snapshot y borra la lista).
  const lockedAmount: CarreraBetLevel | null =
    (currentCycleBets[0]?.amount as CarreraBetLevel | undefined) ?? null;

  // Si el monto se bloquea (primera apuesta del ciclo) o se desbloquea (nuevo
  // ciclo), re-sincronizamos el estado local para que el render muestre la
  // ficha correcta marcada.
  useEffect(() => {
    if (lockedAmount !== null && amount !== lockedAmount) {
      setAmount(lockedAmount);
    }
  }, [lockedAmount, amount]);

  const title = casino?.name ?? (loading ? "Cargando…" : "Carrera");

  return (
    <AppLayout
      title={title}
      subtitle="Carrera de Patrones"
      back={{ to: `/player/casino/${casinoId ?? ""}`, label: "" }}
    >
      {error && (
        <Card tone="night">
          <p role="alert" className="font-label text-sm text-[--color-chip-red-300]">
            {error}
          </p>
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/player/casino/${casinoId ?? ""}`, { replace: true })
              }
            >
              ← Volver
            </Button>
          </div>
        </Card>
      )}

      {!error && (loading || !snapshot) && (
        <Card tone="night">
          <p className="font-label text-sm tracking-wider text-[--color-cream]/70">
            Preparando la carrera…
          </p>
        </Card>
      )}

      {!error && snapshot && (
        <>
          <Card tone="night" className="flex items-center justify-between gap-3">
            <div>
              <div className="font-label text-sm tracking-[0.3em] text-[--color-cream]/60">
                TU SALDO
              </div>
              <Balance amount={balance ?? 0} size="lg" />
            </div>
            <Badge tone={snapshot.phase === "betting" ? "success" : "danger"}>
              {snapshot.phase === "betting"
                ? "APUESTAS ABIERTAS"
                : "EN CARRERA"}
            </Badge>
          </Card>

          <Card tone="felt">
            <PatternRaceView snapshot={snapshot} size="compact" />
          </Card>

          <Card tone="night" className="flex flex-col gap-4">
            <div>
              <h3 className="font-display text-2xl text-[--color-ivory]">
                Apostar en esta carrera
              </h3>
              <p className="font-label text-sm tracking-[0.3em] text-[--color-cream]/60">
                {canBet
                  ? "UNA APUESTA = UN PATRÓN + CÓMO GANA + MONTO"
                  : "APUESTAS CERRADAS · ESPERA LA SIGUIENTE"}
              </p>
              {canBet && (
                <p className="mt-1.5 font-label text-base text-[--color-cream]/80 leading-snug">
                  Elige un patrón y decide cómo quieres ganar: que quede{" "}
                  <strong className="text-[--color-ivory]">1° (Ganador)</strong>{" "}
                  o que quede en{" "}
                  <strong className="text-[--color-ivory]">top 3 (Podio)</strong>
                  . El top 3 es más fácil pero paga menos.
                </p>
              )}
            </div>

            {/* Leyenda didáctica: qué significa "afinidad +N" en los patrones. */}
            <div className="rounded-lg bg-[--color-felt-900]/60 p-3 ring-1 ring-inset ring-[--color-gold-500]/30">
              <div className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
                💡 ¿QUÉ ES LA AFINIDAD?
              </div>
              <p className="mt-1.5 font-label text-base leading-snug text-[--color-cream]/90">
                Qué tan bien resuelve cada patrón el problema de{" "}
                <strong className="text-[--color-ivory]">esta</strong> carrera.
                Va de{" "}
                <span className="font-display text-[--color-cream]/70">+0</span>{" "}
                (no aporta, depende solo de la suerte) a{" "}
                <span className="font-display text-[--color-chip-green-300]">
                  +5
                </span>{" "}
                (solución ideal). A mayor afinidad, más rápido avanza en la
                pista — pero la suerte también pesa.
              </p>
              <p className="mt-2 font-label text-sm leading-snug text-[--color-cream]/70">
                Los <span className="text-[--color-chip-red-300]">anti-patrones</span>{" "}
                (⚠) corren con bonus extra pero chocan seguido: pagan más si
                ganan, casi nunca lo hacen.
              </p>
            </div>

            <StepLabel n={1} label="Elige un patrón" accent="gold" />
            {/* Selector de patrón — gold chip-style cuando está seleccionado para
                que el pick sea inconfundible, igual que las fichas de monto. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {contestants.map((c) => {
                const selected = selectedPattern === c.patternId;
                return (
                  <button
                    key={c.patternId}
                    type="button"
                    disabled={!canBet}
                    onClick={() => setSelectedPattern(c.patternId)}
                    aria-pressed={selected}
                    className={[
                      "rounded-xl px-3 py-2.5 text-left transition-[transform,filter]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-300] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]",
                      selected
                        ? "scale-[1.03] bg-gradient-to-b from-[var(--color-gold-300)] to-[var(--color-gold-500)] shadow-[inset_0_0_0_3px_var(--color-gold-400),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_#8A6A10,0_7px_16px_rgba(0,0,0,0.45)]"
                        : "bg-gradient-to-b from-[var(--color-chip-black-400)] to-[var(--color-chip-black-500)] shadow-[inset_0_0_0_2px_var(--color-chip-black-300),inset_0_0_0_3px_rgba(255,255,255,0.06),0_4px_0_var(--color-chip-black-shadow),0_6px_12px_rgba(0,0,0,0.4)] hover:brightness-125",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{c.emoji}</span>
                      <div className="min-w-0">
                        <div
                          className={[
                            "font-display text-base truncate",
                            selected
                              ? "text-[--color-smoke]"
                              : "text-[--color-ivory]",
                          ].join(" ")}
                        >
                          {c.label}
                        </div>
                        <div
                          className={[
                            "font-label text-xs tracking-widest",
                            selected
                              ? "text-[--color-smoke]/80"
                              : "text-[--color-cream]/60",
                          ].join(" ")}
                        >
                          {c.kind === "anti" ? "⚠ anti-patrón" : `afinidad +${c.bonus}`}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <StepLabel n={2} label="¿Cómo quieres ganar?" accent="blue" />
            {/* Selector de tipo — mismo tratamiento chip para consistencia. */}
            <div className="flex gap-2">
              {(["win", "podium"] as const).map((k) => {
                const selected = betKind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={!canBet}
                    onClick={() => setBetKind(k)}
                    aria-pressed={selected}
                    className={[
                      "flex-1 rounded-xl px-3 py-2.5 text-left transition-[transform,filter]",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-chip-blue-300] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]",
                      selected
                        ? "scale-[1.02] bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)] shadow-[inset_0_0_0_3px_var(--color-chip-blue-300),inset_0_0_0_4px_rgba(255,255,255,0.35),0_5px_0_var(--color-chip-blue-shadow),0_7px_14px_rgba(0,0,0,0.4)]"
                        : "bg-gradient-to-b from-[var(--color-chip-black-400)] to-[var(--color-chip-black-500)] shadow-[inset_0_0_0_2px_var(--color-chip-black-300),inset_0_0_0_3px_rgba(255,255,255,0.06),0_4px_0_var(--color-chip-black-shadow),0_6px_12px_rgba(0,0,0,0.4)] hover:brightness-125",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "font-display text-base",
                        selected ? "text-white" : "text-[--color-ivory]",
                      ].join(" ")}
                    >
                      {BET_KIND_LABEL[k]}
                    </div>
                    <div
                      className={[
                        "font-label text-xs tracking-widest leading-snug mt-0.5",
                        selected ? "text-white/85" : "text-[--color-cream]/60",
                      ].join(" ")}
                    >
                      {BET_KIND_HINT[k]}
                    </div>
                  </button>
                );
              })}
            </div>

            <StepLabel n={3} label="Monto de la ficha" accent="green" />
            {/* Selector de monto en fichas — verde chip cuando está seleccionado.
                Si ya hay una apuesta en este ciclo, el monto queda fijo. */}
            <div className="flex flex-col items-center gap-1.5 py-2">
              <div className="flex items-center justify-center gap-5">
                {CARRERA_BET_LEVELS.map((lvl) => {
                  const selected = amount === lvl;
                  const disabled =
                    !canBet || (lockedAmount !== null && lvl !== lockedAmount);
                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={disabled}
                      onClick={() => setAmount(lvl)}
                      aria-pressed={selected}
                      aria-label={`Apostar ${lvl}`}
                      className={[
                        "relative grid h-24 w-24 place-items-center rounded-full font-display text-2xl font-bold transition-[transform,filter]",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]",
                        selected
                          ? "scale-110 text-white bg-gradient-to-b from-[var(--color-chip-green-400)] to-[var(--color-chip-green-500)] shadow-[inset_0_0_0_3px_var(--color-chip-green-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_6px_0_var(--color-chip-green-shadow),0_9px_18px_rgba(0,0,0,0.5)]"
                          : "scale-100 text-[--color-cream]/85 bg-gradient-to-b from-[var(--color-chip-black-400)] to-[var(--color-chip-black-500)] shadow-[inset_0_0_0_3px_var(--color-chip-black-300),inset_0_0_0_4px_rgba(255,255,255,0.08),0_4px_0_var(--color-chip-black-shadow),0_6px_12px_rgba(0,0,0,0.45)] hover:scale-105 hover:brightness-125 disabled:hover:scale-100 disabled:hover:brightness-100",
                      ].join(" ")}
                    >
                      ${lvl}
                    </button>
                  );
                })}
              </div>
              {lockedAmount !== null && (
                <div className="mt-1 font-label text-sm tracking-[0.2em] text-[--color-gold-300]">
                  🔒 MONTO FIJO ${lockedAmount} PARA ESTA CARRERA
                </div>
              )}
            </div>

            {/* Resumen textual de la apuesta completa — antes de confirmar
                queda claro qué significa el pick. */}
            {canBet && (
              <BetSummary
                selectedPattern={selectedPattern}
                contestants={contestants}
                betKind={betKind}
                amount={amount}
              />
            )}

            {betError && (
              <p
                role="alert"
                className="font-label text-sm tracking-wider text-[--color-chip-red-300]"
              >
                {betError}
              </p>
            )}
            {betSuccess && (
              <p className="font-label text-sm tracking-wider text-[--color-chip-green-300]">
                {betSuccess}
              </p>
            )}

            <Button
              variant="primary"
              size="md"
              block
              disabled={!canBet || !selectedPattern || placing}
              onClick={handlePlace}
            >
              {placing ? "Colocando…" : "Apostar ahora"}
            </Button>
          </Card>

          {/* Mis apuestas del ciclo actual */}
          {currentCycleBets.length > 0 && (
            <Card tone="night" className="flex flex-col gap-2">
              <h3 className="font-display text-lg text-[--color-ivory]">
                Tus apuestas en ESTA carrera
              </h3>
              <ul className="flex flex-col gap-2">
                {currentCycleBets.map((b) => (
                  <BetRow key={b.id} bet={b} contestants={contestants} />
                ))}
              </ul>
            </Card>
          )}

          {/* Historial reciente */}
          {previousCycleBets.length > 0 && (
            <Card tone="night" className="flex flex-col gap-2">
              <h3 className="font-display text-lg text-[--color-ivory]">
                Carreras anteriores
              </h3>
              <ul className="flex flex-col gap-2">
                {previousCycleBets.slice(0, 10).map((b) => (
                  <BetRow key={b.id} bet={b} contestants={contestants} />
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </AppLayout>
  );
}

/**
 * Paso numerado del flujo de apuesta. El número en burbuja del color del chip
 * correspondiente a la dimensión (gold=patrón, blue=tipo, green=monto) ata
 * visualmente el paso con los controles debajo.
 */
function StepLabel({
  n,
  label,
  accent,
}: {
  n: number;
  label: string;
  accent: "gold" | "blue" | "green";
}) {
  const bubble =
    accent === "gold"
      ? "bg-[--color-gold-400] text-[--color-smoke]"
      : accent === "blue"
        ? "bg-[--color-chip-blue-500] text-white"
        : "bg-[--color-chip-green-500] text-white";
  return (
    <div className="flex items-center gap-2 pt-1">
      <span
        className={[
          "grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-base",
          bubble,
        ].join(" ")}
      >
        {n}
      </span>
      <span className="font-label text-sm tracking-[0.2em] text-[--color-cream]/90">
        {label}
      </span>
    </div>
  );
}

/**
 * Frase en lenguaje natural de la apuesta que está por colocarse. Evita la
 * ambigüedad "¿es patrón O tipo?" — es UN solo pick combinando los tres ejes.
 */
function BetSummary({
  selectedPattern,
  contestants,
  betKind,
  amount,
}: {
  selectedPattern: string | null;
  contestants: PatternRaceContestantPayload[];
  betKind: PatternRaceBetKind;
  amount: number;
}) {
  const contestant =
    contestants.find((c) => c.patternId === selectedPattern) ?? null;
  return (
    <div className="rounded-lg bg-[--color-felt-900]/60 p-3.5 ring-1 ring-inset ring-white/10">
      <div className="font-label text-xs tracking-[0.25em] text-[--color-cream]/55">
        TU APUESTA
      </div>
      {contestant ? (
        <p className="mt-1.5 font-display text-base text-[--color-ivory] leading-snug">
          Apuestas{" "}
          <span className="text-[--color-chip-green-300]">${amount}</span> a que{" "}
          <span className="text-[--color-gold-300]">
            {contestant.emoji} {contestant.label}
          </span>{" "}
          {betKind === "win" ? (
            <>
              quede en{" "}
              <span className="text-[--color-chip-blue-300]">1° lugar</span>
            </>
          ) : (
            <>
              quede en el{" "}
              <span className="text-[--color-chip-blue-300]">top 3</span>
            </>
          )}
          .
        </p>
      ) : (
        <p className="mt-1.5 font-label text-sm text-[--color-cream]/70">
          Elige un patrón arriba para ver tu apuesta.
        </p>
      )}
    </div>
  );
}

function BetRow({
  bet,
  contestants,
}: {
  bet: PatternRaceBetPayload;
  contestants: PatternRaceContestantPayload[];
}) {
  // Preferimos el enrichment del backend (bet.pick) que ya trae emoji + bonus.
  // Si por alguna razón no viene, caemos a lookup por patternId en los
  // contestants actuales (funciona sólo si la apuesta es del ciclo actual).
  const pickLabel =
    bet.pick?.label ??
    contestants.find((c) => c.patternId === bet.patternId)?.label ??
    bet.patternId;
  const pickEmoji =
    bet.pick?.emoji ??
    contestants.find((c) => c.patternId === bet.patternId)?.emoji ??
    "◆";
  const tone =
    bet.status === "won" ? "success" : bet.status === "lost" ? "danger" : "neutral";
  const statusLabel =
    bet.status === "won"
      ? `GANADA +$${bet.payout}`
      : bet.status === "lost"
        ? "PERDIDA"
        : "ABIERTA";
  // Coincidencia didáctica: ¿eligió la solución canónica?
  const pickedIdeal =
    bet.ideal && bet.pick && bet.ideal.patternId === bet.pick.patternId;

  return (
    <li className="flex flex-col gap-2.5 rounded-xl bg-[--color-smoke-800]/60 p-3.5 ring-1 ring-inset ring-white/5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-display text-base text-[--color-ivory] truncate">
            {pickEmoji} {pickLabel} · {BET_KIND_LABEL[bet.kind]}
          </div>
          <div className="font-label text-sm tracking-wider text-[--color-cream]/70">
            ${bet.amount} · carrera #{bet.cycleIndex}
            {bet.pick?.finalPosition && bet.status !== "open"
              ? ` · terminó #${bet.pick.finalPosition}`
              : ""}
          </div>
        </div>
        <Badge tone={tone} size="md">
          {statusLabel}
        </Badge>
      </div>

      {/* Bloque didáctico: problema + respuesta ideal. Siempre que venga del
          backend enrichment, sin importar el status. */}
      {bet.problem && (
        <div className="flex flex-col gap-2 rounded-lg bg-[--color-felt-900]/60 p-3 ring-1 ring-inset ring-white/5">
          <div className="font-label text-xs tracking-[0.25em] text-[--color-cream]/55">
            PROBLEMA
          </div>
          <p className="font-display text-base text-[--color-ivory] leading-snug">
            {bet.problem.statement}
          </p>
          {bet.ideal && (
            <div
              className={[
                "mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2",
                pickedIdeal
                  ? "bg-[--color-chip-green-500]/20 ring-1 ring-inset ring-[--color-chip-green-400]/50"
                  : "bg-[--color-gold-500]/15 ring-1 ring-inset ring-[--color-gold-400]/40",
              ].join(" ")}
            >
              <span className="text-2xl">{bet.ideal.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-label text-xs tracking-[0.25em] text-[--color-gold-300]">
                  SOLUCIÓN IDEAL
                </div>
                <div className="font-display text-base text-[--color-ivory] truncate">
                  {bet.ideal.label}
                  <span className="font-label text-sm text-[--color-cream]/70">
                    {" "}
                    · afinidad +{bet.ideal.bonus}
                  </span>
                </div>
              </div>
              {pickedIdeal && (
                <Badge tone="success" size="sm">
                  ¡ELEGISTE EL IDEAL!
                </Badge>
              )}
            </div>
          )}
          {/* Si la carrera ya corrió y el ganador NO fue el ideal, lo mostramos
              para enseñar que la suerte también pesa. */}
          {bet.status !== "open" &&
            bet.winner &&
            bet.ideal &&
            bet.winner.patternId !== bet.ideal.patternId && (
              <div className="flex items-center gap-2 rounded-md px-2 py-1 text-[--color-cream]/85">
                <span className="text-base">🏆</span>
                <span className="font-label text-sm tracking-wider leading-snug">
                  Esta vez ganó{" "}
                  <span className="font-display text-[--color-ivory]">
                    {bet.winner.emoji} {bet.winner.label}
                  </span>
                  {bet.winner.bonus > 0
                    ? ` (afinidad +${bet.winner.bonus})`
                    : " — upset del día"}
                </span>
              </div>
            )}
        </div>
      )}
    </li>
  );
}
