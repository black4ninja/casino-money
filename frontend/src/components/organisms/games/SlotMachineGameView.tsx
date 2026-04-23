import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { SlotMachineReel } from "../SlotMachineReel";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { Balance } from "@/components/atoms/Balance";
import { NeonBulb } from "@/components/atoms/NeonBulb";
import { useAuthStore } from "@/stores/authStore";
import {
  apiPlaySlotSpin,
  type SlotSpinResponse,
  type SlotSpinOutcome,
} from "@/lib/slotsApi";
import type { ApiError } from "@/lib/authApi";
import {
  SLOT_BETS,
  SLOT_PAYOUT_RULES,
  SLOT_SYMBOLS,
  findSlotSymbol,
  type SlotBet,
  type SlotSymbolId,
} from "@/domain/slotSymbols";

type Props = {
  casinoId: string;
  /** Saldo inicial del wallet del jugador en este casino (fetched por el parent). */
  initialBalance: number;
};

const REEL_DURATIONS_MS: [number, number, number] = [2200, 2800, 3400];
const SWIPE_THRESHOLD_PX = 80;
const LEVER_TRAVEL_PX = 120;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function outcomeMessage(outcome: SlotSpinOutcome): { title: string; tone: "gold" | "info" | "danger" | "success" } {
  switch (outcome) {
    case "jackpot_triple_wild":
      return { title: "¡JACKPOT!", tone: "gold" };
    case "triple_pattern":
      return { title: "Tres iguales", tone: "gold" };
    case "line_of_patterns":
      return { title: "Línea limpia de patrones", tone: "info" };
    case "two_wilds_one_pattern":
    case "wild_completes_pair":
      return { title: "El comodín ayudó", tone: "info" };
    case "pair":
      return { title: "Pareja — reembolso", tone: "success" };
    case "anti_pattern_loss":
      return { title: "Anti-patrón en la línea", tone: "danger" };
    case "no_match":
      return { title: "Sin combinación", tone: "danger" };
  }
}

/**
 * Vista completa de la tragamonedas. Maneja:
 *   - Selector de apuesta ($100 / $200 / $500)
 *   - Palanca lateral con swipe vertical (pointer events nativos)
 *   - Llamada al backend para spin autoritativo (RNG server-side)
 *   - 3 rodillos con stagger que aterrizan en el resultado del server
 *   - Modal de resultado con payout y saldo actualizado
 *
 * NO carga chrome de página (título, back button). El parent page lo envuelve
 * en `AppLayout`.
 */
export function SlotMachineGameView({ casinoId, initialBalance }: Props) {
  const reduced = useReducedMotion();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [bet, setBet] = useState<SlotBet>(100);
  const [balance, setBalance] = useState<number>(initialBalance);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targets, setTargets] = useState<[SlotSymbolId | null, SlotSymbolId | null, SlotSymbolId | null]>([null, null, null]);
  const [lastResponse, setLastResponse] = useState<SlotSpinResponse | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const landedRef = useRef<[boolean, boolean, boolean]>([false, false, false]);

  // Palanca: estado del swipe en curso.
  const [leverOffset, setLeverOffset] = useState(0); // 0..LEVER_TRAVEL_PX
  const [leverAnimating, setLeverAnimating] = useState(false);
  const leverStartRef = useRef<number | null>(null);

  // Sync balance if parent passes a new one (e.g. refetched).
  useEffect(() => {
    setBalance(initialBalance);
  }, [initialBalance]);

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

  const triggerSpin = useCallback(async () => {
    if (isSpinning) return;
    if (balance < bet) {
      setError("Saldo insuficiente para esta apuesta.");
      return;
    }
    setError(null);
    setShowResult(false);
    setIsSpinning(true);
    landedRef.current = [false, false, false];
    // Reset targets — los rodillos girarán hasta recibir el resultado del server.
    setTargets([null, null, null]);

    const batchId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      const response = await withAuth((token) =>
        apiPlaySlotSpin(token, casinoId, { bet, batchId }),
      );
      setLastResponse(response);
      setTargets(response.spin.result);

      // Reducir movimiento: saltea la animación y muestra resultado al tiro.
      if (reduced) {
        setBalance(response.balanceAfter);
        setTimeout(() => {
          setIsSpinning(false);
          setShowResult(true);
        }, 50);
      }
    } catch (err) {
      const e = err as ApiError;
      setError(e.message ?? "No se pudo jugar");
      setIsSpinning(false);
      setTargets([null, null, null]);
    }
  }, [bet, balance, casinoId, isSpinning, reduced, withAuth]);

  // Callback de cada rodillo cuando aterriza.
  const handleReelLand = useCallback(
    (index: 0 | 1 | 2) => {
      if (landedRef.current[index]) return;
      landedRef.current[index] = true;
      if (landedRef.current.every((v) => v) && lastResponse) {
        setIsSpinning(false);
        setBalance(lastResponse.balanceAfter);
        setShowResult(true);
      }
    },
    [lastResponse],
  );

  // Palanca SVG — pointer events nativos (patrón de RouletteWheel.tsx).
  const onLeverPointerDown = (e: React.PointerEvent<SVGGElement>) => {
    if (isSpinning) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    leverStartRef.current = e.clientY;
    setLeverAnimating(false);
  };

  const onLeverPointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (leverStartRef.current == null || isSpinning) return;
    const delta = Math.max(
      0,
      Math.min(LEVER_TRAVEL_PX, e.clientY - leverStartRef.current),
    );
    setLeverOffset(delta);
  };

  const onLeverPointerUp = (e: React.PointerEvent<SVGGElement>) => {
    if (leverStartRef.current == null) return;
    const delta = e.clientY - leverStartRef.current;
    leverStartRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setLeverAnimating(true);
    setLeverOffset(0);
    if (delta >= SWIPE_THRESHOLD_PX && !isSpinning) {
      // Dispara spin — deja que la palanca haga el rebote mientras el API responde.
      triggerSpin();
    }
  };

  const onLeverPointerCancel = () => {
    leverStartRef.current = null;
    setLeverAnimating(true);
    setLeverOffset(0);
  };

  const progress = Math.min(1, leverOffset / SWIPE_THRESHOLD_PX);
  const leverStyle: CSSProperties = {
    transform: `translateY(${leverOffset}px)`,
    transition: leverAnimating
      ? "transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)"
      : "none",
    transformBox: "fill-box",
    cursor: isSpinning ? "default" : "grab",
  };

  const canPlay = !isSpinning && balance >= bet;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Saldo + apuesta */}
      <Card tone="night" className="flex flex-col gap-3 w-full max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/60">
              SALDO
            </p>
            <Balance amount={balance} />
          </div>
          <Badge tone="gold">Tragamonedas</Badge>
        </div>

        <div>
          <p className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/60 mb-2">
            APUESTA POR TIRADA
          </p>
          <div className="flex flex-wrap gap-2">
            {SLOT_BETS.map((b) => (
              <Button
                key={b}
                variant={b === bet ? "gold" : "info"}
                size="sm"
                onClick={() => {
                  if (isSpinning) return;
                  setBet(b);
                  setError(null);
                }}
                disabled={isSpinning}
              >
                ${b}
              </Button>
            ))}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="font-label text-xs tracking-wider text-[--color-chip-red-300]"
          >
            {error}
          </p>
        )}
      </Card>

      {/* Máquina física: rodillos + palanca lateral */}
      <div className="flex items-start gap-4">
        <Card
          tone="felt"
          className="relative flex items-center justify-center gap-3 px-6 py-6 ring-2 ring-inset ring-[--color-gold-500]/60"
        >
          {/* Marquee de bulbs arriba */}
          <div
            aria-hidden
            className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-3 rounded-full bg-[--color-smoke]/85 px-4 py-1.5 ring-1 ring-inset ring-[--color-gold-500]/40"
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <NeonBulb key={i} delay={(i % 4) * 160} size={8} />
            ))}
          </div>

          <SlotMachineReel
            target={targets[0]}
            isSpinning={isSpinning}
            durationMs={REEL_DURATIONS_MS[0]}
            startDelayMs={0}
            onLand={() => handleReelLand(0)}
            ariaLabel="Rodillo 1"
          />
          <SlotMachineReel
            target={targets[1]}
            isSpinning={isSpinning}
            durationMs={REEL_DURATIONS_MS[1]}
            startDelayMs={150}
            onLand={() => handleReelLand(1)}
            ariaLabel="Rodillo 2"
          />
          <SlotMachineReel
            target={targets[2]}
            isSpinning={isSpinning}
            durationMs={REEL_DURATIONS_MS[2]}
            startDelayMs={300}
            onLand={() => handleReelLand(2)}
            ariaLabel="Rodillo 3"
          />

          {/* Marquee de bulbs abajo */}
          <div
            aria-hidden
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-3 rounded-full bg-[--color-smoke]/85 px-4 py-1.5 ring-1 ring-inset ring-[--color-gold-500]/40"
          >
            {Array.from({ length: 7 }).map((_, i) => (
              <NeonBulb key={i} delay={((i + 2) % 4) * 160} size={8} />
            ))}
          </div>
        </Card>

        {/* Palanca lateral */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="font-label text-[0.6rem] tracking-[0.3em] text-[--color-cream]/60">
            DESLIZA
          </p>
          <svg
            viewBox="0 0 80 220"
            width="60"
            height="165"
            xmlns="http://www.w3.org/2000/svg"
            className="select-none [touch-action:none]"
            aria-hidden
          >
            <defs>
              <linearGradient id="lever-shaft" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8a6a10" />
                <stop offset="50%" stopColor="var(--color-gold-400)" />
                <stop offset="100%" stopColor="#8a6a10" />
              </linearGradient>
              <radialGradient id="lever-knob" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#fff8e4" />
                <stop offset="45%" stopColor="var(--color-chip-red-300)" />
                <stop offset="100%" stopColor="var(--color-chip-red-500)" />
              </radialGradient>
            </defs>
            {/* Base / mount */}
            <rect
              x="26"
              y="180"
              width="28"
              height="30"
              rx="3"
              fill="var(--color-smoke-800)"
              stroke="var(--color-gold-500)"
              strokeWidth="1.5"
            />
            <g
              onPointerDown={onLeverPointerDown}
              onPointerMove={onLeverPointerMove}
              onPointerUp={onLeverPointerUp}
              onPointerCancel={onLeverPointerCancel}
              onPointerLeave={onLeverPointerCancel}
              style={leverStyle}
              role="button"
              tabIndex={isSpinning ? -1 : 0}
              aria-label="Palanca — deslízala hacia abajo para girar"
              aria-disabled={isSpinning || undefined}
              onKeyDown={(e) => {
                if (isSpinning) return;
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  triggerSpin();
                }
              }}
            >
              {/* Vástago */}
              <rect x="36" y="40" width="8" height="150" rx="3" fill="url(#lever-shaft)" />
              {/* Knob */}
              <circle cx="40" cy="30" r="22" fill="url(#lever-knob)" stroke="#6d0b0e" strokeWidth="2" />
            </g>
            {/* Guía visual del progreso del swipe */}
            <line
              x1="12"
              y1="60"
              x2="12"
              y2="180"
              stroke="var(--color-gold-500)"
              strokeOpacity="0.25"
              strokeWidth="2"
            />
            <line
              x1="12"
              y1="60"
              x2="12"
              y2={60 + 120 * progress}
              stroke="var(--color-gold-400)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <Button
            variant="gold"
            size="sm"
            onClick={() => triggerSpin()}
            disabled={!canPlay}
          >
            {isSpinning ? "Girando…" : "Jalar"}
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" size="sm" onClick={() => setShowRules((v) => !v)}>
          {showRules ? "Ocultar reglas" : "Ver reglas"}
        </Button>
      </div>

      {showRules && <RulesPanel />}

      {showResult && lastResponse && (
        <SlotResultModal
          response={lastResponse}
          onClose={() => setShowResult(false)}
          onPlayAgain={() => {
            setShowResult(false);
            triggerSpin();
          }}
        />
      )}
    </div>
  );
}

function RulesPanel() {
  return (
    <Card tone="night" className="w-full max-w-md">
      <h3 className="font-display text-xl text-[--color-ivory] mb-3">
        Tabla de pagos
      </h3>
      <ul className="flex flex-col gap-2">
        {SLOT_PAYOUT_RULES.map((rule) => (
          <li
            key={rule.combo}
            className="flex items-center justify-between gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-2 ring-1 ring-inset ring-white/5"
          >
            <span className="font-label text-xs tracking-wider text-[--color-cream]/85">
              {rule.combo}
            </span>
            <Badge tone={rule.tone} size="sm">
              {rule.multiplier}
            </Badge>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <p className="font-label text-[0.65rem] tracking-widest text-[--color-cream]/55">
          SÍMBOLOS
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SLOT_SYMBOLS.map((s) => (
            <Badge
              key={s.id}
              tone={s.tone}
              size="sm"
            >
              {s.shortName}
            </Badge>
          ))}
        </div>
        <p className="mt-3 font-label text-[0.65rem] tracking-wider text-[--color-cream]/50">
          Los anti-patrones (God Object, Spaghetti) cualquier lugar en la línea
          central pierden la apuesta. El jackpot máximo es 5×.
        </p>
      </div>
    </Card>
  );
}

type SlotResultModalProps = {
  response: SlotSpinResponse;
  onClose: () => void;
  onPlayAgain: () => void;
};

function SlotResultModal({ response, onClose, onPlayAgain }: SlotResultModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { title, tone } = outcomeMessage(response.outcome);
  const symbols = useMemo(
    () => response.spin.result.map((id) => findSlotSymbol(id)),
    [response.spin.result],
  );

  const won = response.spin.payout > 0;
  const net = response.spin.net;
  const netLabel = net > 0 ? `+$${net}` : net < 0 ? `-$${Math.abs(net)}` : "$0";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-result-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />
      <div className="relative z-10 flex w-full max-w-md flex-col items-stretch gap-3 animate-chip-pop">
        <div
          aria-hidden
          className="flex items-center justify-center gap-3 rounded-full bg-[--color-smoke]/70 px-4 py-2 ring-1 ring-inset ring-[--color-gold-500]/40"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <NeonBulb key={i} delay={(i % 4) * 150} size={10} />
          ))}
        </div>

        <Card
          tone="felt"
          style={{ marginInline: 0 }}
          className="animate-marquee-glow relative overflow-hidden ring-2 ring-inset ring-[--color-gold-500]/60"
        >
          <div
            className={[
              "-mx-5 -mt-5 mb-4 py-2 text-center shadow-[inset_0_-3px_0_rgba(0,0,0,0.4)]",
              won
                ? "bg-gradient-to-b from-[--color-gold-300] via-[--color-gold-400] to-[--color-gold-500]"
                : "bg-gradient-to-b from-[--color-chip-red-300] via-[--color-chip-red-400] to-[--color-chip-red-500]",
            ].join(" ")}
          >
            <p
              className={[
                "font-label text-sm tracking-[0.35em]",
                won ? "text-[--color-smoke]" : "text-white",
              ].join(" ")}
            >
              {won ? "★ ¡GANASTE! ★" : "SIN SUERTE"}
            </p>
          </div>

          <div className="text-center">
            <h2
              id="slot-result-title"
              className="gold-shine font-display text-3xl font-black leading-tight sm:text-4xl"
            >
              {title}
            </h2>
            <div className="mt-3 flex justify-center">
              <Badge tone={tone} size="md">
                {response.spin.multiplier}× multiplicador
              </Badge>
            </div>
            <div className="mt-5 flex justify-center gap-2">
              {symbols.map((s, i) =>
                s ? (
                  <span
                    key={`${i}-${s.id}`}
                    className="flex h-16 w-16 items-center justify-center rounded-lg bg-[--color-smoke]/70 ring-1 ring-inset ring-[--color-gold-500]/40 font-display text-2xl"
                    aria-label={s.name}
                  >
                    {s.glyph}
                  </span>
                ) : null,
              )}
            </div>
            <div className="mt-5 flex flex-col gap-1">
              <p className="font-label text-xs tracking-widest text-[--color-cream]/70">
                Apostaste ${response.spin.bet}
              </p>
              <p className="font-label text-xs tracking-widest text-[--color-cream]/70">
                Pago: ${response.spin.payout}{" "}
                <span
                  className={net > 0 ? "text-[--color-gold-300]" : net < 0 ? "text-[--color-chip-red-300]" : ""}
                >
                  (neto {netLabel})
                </span>
              </p>
              <p className="mt-2 font-label text-sm tracking-widest text-[--color-cream]">
                Saldo ahora: ${response.balanceAfter}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="gold" onClick={onPlayAgain} autoFocus>
              Jugar de nuevo
            </Button>
          </div>
        </Card>

        <div
          aria-hidden
          className="flex items-center justify-center gap-3 rounded-full bg-[--color-smoke]/70 px-4 py-2 ring-1 ring-inset ring-[--color-gold-500]/40"
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <NeonBulb key={i} delay={((i + 2) % 4) * 150} size={10} />
          ))}
        </div>
      </div>
    </div>
  );
}
