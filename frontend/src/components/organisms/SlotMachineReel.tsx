import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  SLOT_SYMBOLS,
  type SlotSymbol,
  type SlotSymbolId,
} from "@/domain/slotSymbols";

const CELL_H = 80;
const CELL_W = 84;
const STRIP_PADDING_SYMBOLS = 18; // más símbolos = más velocidad percibida
const OVERSHOOT_PX = 18; // "pasa" el target y regresa — simula inercia mecánica
const SETTLE_MS = 220; // duración del micro-bounce de regreso

type Props = {
  /** Símbolo donde debe aterrizar este rodillo. null ⇒ reposo. */
  target: SlotSymbolId | null;
  /** Trigger: cuando cambia de false→true con target presente, rueda. */
  isSpinning: boolean;
  /** Duración total de la fase principal de giro (sin contar el settle). */
  durationMs: number;
  /** Ms a esperar antes de arrancar este rodillo — permite stagger entre 1/2/3. */
  startDelayMs: number;
  /** Fires al terminar el settle (el rodillo está quieto en el target). */
  onLand?: () => void;
  /** Accesibilidad: label describiendo el rodillo. */
  ariaLabel?: string;
};

type Phase = "idle" | "spinning" | "settling";

function pickRandom<T>(arr: readonly T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i]!;
}

function symbolById(id: SlotSymbolId): SlotSymbol {
  return SLOT_SYMBOLS.find((s) => s.id === id) ?? SLOT_SYMBOLS[0]!;
}

/**
 * Un rodillo de la tragamonedas. Dos fases de animación:
 *
 *   1. `spinning` — construye una strip dinámica (padding random + target al
 *      final) y anima `translateY` ~toda la strip, con un overshoot de
 *      `OVERSHOOT_PX` para simular que el rodillo pasa ligeramente el target
 *      por inercia. Curva cubic-bezier con arranque marcado y desaceleración
 *      pronunciada. Motion blur CSS mientras se mueve.
 *
 *   2. `settling` — un micro-bounce spring que regresa de la posición con
 *      overshoot a la posición exacta del target. Se siente mecánico
 *      (peg-lock al stop). Al terminar dispara `onLand`.
 *
 * Al quedar `isSpinning=false` y `target` fijo, colapsa la strip a 3 celdas
 * (reposo visual) para no cargar arrays grandes.
 */
export function SlotMachineReel({
  target,
  isSpinning,
  durationMs,
  startDelayMs,
  onLand,
  ariaLabel,
}: Props) {
  const [strip, setStrip] = useState<SlotSymbolId[]>(() => {
    const initial: SlotSymbolId[] = [];
    for (let i = 0; i < 3; i++) initial.push(pickRandom(SLOT_SYMBOLS).id);
    return initial;
  });
  const [offsetY, setOffsetY] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const landedOffsetRef = useRef(0); // target final sin overshoot

  const centerSymbol = useMemo(() => {
    const idx = Math.min(1, strip.length - 1);
    return symbolById(strip[idx]!);
  }, [strip]);

  // Arranca el giro cuando isSpinning pasa a true con target presente.
  useEffect(() => {
    if (!isSpinning || target == null) return;
    let cancelled = false;
    let startTimer: number | null = null;
    let safetyTimer: number | null = null;

    const newStrip: SlotSymbolId[] = [];
    const resting = strip[1] ?? pickRandom(SLOT_SYMBOLS).id;
    newStrip.push(resting);
    for (let i = 0; i < STRIP_PADDING_SYMBOLS; i++) {
      newStrip.push(pickRandom(SLOT_SYMBOLS).id);
    }
    newStrip.push(target);

    const cellsToAdvance = newStrip.length - 2;
    const landedOffset = -cellsToAdvance * CELL_H;
    landedOffsetRef.current = landedOffset;

    // Reset visual instantáneo (phase=idle corta la transición).
    setPhase("idle");
    setStrip(newStrip);
    setOffsetY(0);

    startTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPhase("spinning");
      // Overshoot: va un poco más allá del target final por inercia.
      setOffsetY(landedOffset - OVERSHOOT_PX);
    }, Math.max(0, startDelayMs) + 20);

    // Fallback por si onTransitionEnd no dispara en algún navegador raro o
    // prefers-reduced-motion; dispara onLand tras la duración total esperada.
    safetyTimer = window.setTimeout(
      () => {
        if (cancelled) return;
        setPhase("idle");
        setOffsetY(landedOffset);
        onLand?.();
      },
      Math.max(0, startDelayMs) + durationMs + SETTLE_MS + 400,
    );

    return () => {
      cancelled = true;
      if (startTimer != null) window.clearTimeout(startTimer);
      if (safetyTimer != null) window.clearTimeout(safetyTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, target]);

  // Colapsa la strip al estado de reposo cuando deja de girar.
  useEffect(() => {
    if (isSpinning || target == null) return;
    const t = window.setTimeout(() => {
      setPhase("idle");
      setStrip([
        pickRandom(SLOT_SYMBOLS).id,
        target,
        pickRandom(SLOT_SYMBOLS).id,
      ]);
      setOffsetY(0);
    }, 60);
    return () => window.clearTimeout(t);
  }, [isSpinning, target]);

  // Transición + filtro dinámicos por fase.
  const transitionCss =
    phase === "spinning"
      ? // Arranque con aceleración visible + desaceleración pronunciada.
        `transform ${durationMs}ms cubic-bezier(0.33, 0.02, 0.15, 1) ${Math.max(0, startDelayMs)}ms`
      : phase === "settling"
        ? // Spring de regreso al target (rebote suave, sin overshoot visible).
          `transform ${SETTLE_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
        : "none";

  // Motion blur vertical mientras gira — pequeño pero perceptible.
  const isMoving = phase === "spinning";
  const filterCss = isMoving ? "blur(0.9px) saturate(1.05)" : "none";

  const transformCss = `translate3d(0, ${offsetY}px, 0)`;

  const innerStyle: CSSProperties = {
    transform: transformCss,
    transition: transitionCss,
    filter: filterCss,
    willChange: phase === "idle" ? "auto" : "transform, filter",
  };

  return (
    <div
      role="img"
      aria-label={
        ariaLabel ??
        (isSpinning ? "Rodillo girando" : `Rodillo en ${centerSymbol.name}`)
      }
      className="relative overflow-hidden rounded-xl bg-[--color-smoke]/85 ring-2 ring-inset ring-[--color-gold-500]/50 shadow-[inset_0_6px_18px_rgba(0,0,0,0.65)]"
      style={{ width: `${CELL_W}px`, height: `${CELL_H * 3}px` }}
    >
      {/* Vignette top/bottom para dar profundidad al viewport. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-6 z-20 bg-gradient-to-b from-black/55 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-6 z-20 bg-gradient-to-t from-black/55 to-transparent"
      />

      {/* Highlight overlay para la fila central (la que cuenta). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 z-10 border-y-2 border-[--color-gold-400]/70 bg-gradient-to-b from-[--color-gold-500]/10 via-transparent to-[--color-gold-500]/10"
        style={{ top: `${CELL_H}px`, height: `${CELL_H}px` }}
      />

      <div
        onTransitionEnd={(e) => {
          if (e.propertyName !== "transform") return;
          if (phase === "spinning") {
            // Termina la fase de overshoot → arranca el settle.
            setPhase("settling");
            setOffsetY(landedOffsetRef.current);
          } else if (phase === "settling") {
            setPhase("idle");
            onLand?.();
          }
        }}
        style={innerStyle}
      >
        {strip.map((id, i) => {
          const sym = symbolById(id);
          return (
            <div
              key={`${i}-${id}`}
              className={[
                "flex flex-col items-center justify-center gap-0.5 select-none",
                toneBg(sym.tone),
              ].join(" ")}
              style={{ width: `${CELL_W}px`, height: `${CELL_H}px` }}
            >
              {sym.images ? (
                <picture>
                  <source srcSet={sym.images.avif} type="image/avif" />
                  <source srcSet={sym.images.webp} type="image/webp" />
                  <img
                    src={sym.images.webp}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    className="h-11 w-11 rounded-md object-cover ring-1 ring-inset ring-white/25"
                  />
                </picture>
              ) : (
                <span
                  aria-hidden
                  className={[
                    "font-display leading-none select-none",
                    toneText(sym.tone),
                    sym.kind === "anti" ? "text-2xl" : "text-3xl font-black",
                  ].join(" ")}
                >
                  {sym.glyph}
                </span>
              )}
              <span
                className={[
                  "font-label text-[0.5rem] tracking-[0.1em] uppercase",
                  toneLabel(sym.tone),
                ].join(" ")}
              >
                {sym.shortName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function toneBg(tone: SlotSymbol["tone"]): string {
  switch (tone) {
    case "gold":
      return "bg-gradient-to-b from-[var(--color-gold-300)] to-[var(--color-gold-500)]";
    case "info":
      return "bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)]";
    case "danger":
      return "bg-gradient-to-b from-[var(--color-chip-red-400)] to-[var(--color-chip-red-500)]";
    case "success":
      return "bg-gradient-to-b from-[var(--color-chip-green-400)] to-[var(--color-chip-green-500)]";
  }
}

function toneText(tone: SlotSymbol["tone"]): string {
  switch (tone) {
    case "gold":
      return "text-[--color-smoke]";
    default:
      return "text-white";
  }
}

function toneLabel(tone: SlotSymbol["tone"]): string {
  switch (tone) {
    case "gold":
      return "text-[--color-smoke]/80";
    default:
      return "text-white/85";
  }
}
