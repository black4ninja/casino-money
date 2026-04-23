import { useEffect, useMemo, useRef, useState } from "react";
import {
  SLOT_SYMBOLS,
  type SlotSymbol,
  type SlotSymbolId,
} from "@/domain/slotSymbols";

const CELL_H = 96; // px de una celda
const STRIP_PADDING_SYMBOLS = 12; // símbolos randomizados antes del target

type Props = {
  /** Símbolo donde debe aterrizar este rodillo. null ⇒ reposo. */
  target: SlotSymbolId | null;
  /** Trigger: cuando cambia de false→true con target presente, rueda. */
  isSpinning: boolean;
  /** Duración total de giro del rodillo (distinta por rodillo para stagger). */
  durationMs: number;
  /** Ms a esperar antes de arrancar este rodillo — permite stagger entre 1/2/3. */
  startDelayMs: number;
  /** Fires al terminar la transición de este rodillo. */
  onLand?: () => void;
  /** Accesibilidad: label describiendo el rodillo. */
  ariaLabel?: string;
};

function pickRandom<T>(arr: readonly T[]): T {
  const i = Math.floor(Math.random() * arr.length);
  return arr[i]!;
}

function symbolById(id: SlotSymbolId): SlotSymbol {
  return SLOT_SYMBOLS.find((s) => s.id === id) ?? SLOT_SYMBOLS[0]!;
}

/**
 * Un rodillo de la tragamonedas. Construye dinámicamente una "tira" de
 * símbolos cuando empieza a girar: muchos símbolos aleatorios terminando en
 * el target. Anima `translateY` acumulado de 0 a -(strip.length-1)*CELL_H con
 * cubic-bezier para desacelerar; al acabar se emite `onLand`.
 *
 * Tras aterrizar, el rodillo queda con el target centrado (reset al estado
 * "de reposo" con translateY=0 y strip=[target, ...símbolos aleatorios] para
 * que el próximo giro no parta visualmente de un punto aleatorio).
 */
export function SlotMachineReel({
  target,
  isSpinning,
  durationMs,
  startDelayMs,
  onLand,
  ariaLabel,
}: Props) {
  // Estado visible: lista de símbolos apilados verticalmente (top→bottom),
  // y el offset actual de translateY. La celda visible "activa" es el índice
  // 1 de los 3 centrales (la fila central del grid 3×3).
  const [strip, setStrip] = useState<SlotSymbolId[]>(() => {
    const initial: SlotSymbolId[] = [];
    for (let i = 0; i < 3; i++) initial.push(pickRandom(SLOT_SYMBOLS).id);
    return initial;
  });
  const [offsetY, setOffsetY] = useState(0);
  const [transitionActive, setTransitionActive] = useState(false);
  const firstSpinRef = useRef(true);

  // Compose a ver-pretty label for SR users.
  const centerSymbol = useMemo(() => {
    const idx = Math.min(1, strip.length - 1);
    return symbolById(strip[idx]!);
  }, [strip]);

  // Arranca el giro cuando isSpinning pasa a true y hay target.
  useEffect(() => {
    if (!isSpinning || target == null) return;
    let cancelled = false;
    let startTimer: number | null = null;
    let endTimer: number | null = null;

    // Build a new strip: STRIP_PADDING_SYMBOLS aleatorios + target.
    const newStrip: SlotSymbolId[] = [];
    // Mantenemos el símbolo central actual como primer elemento para que el
    // inicio de la animación no haga "salto" visual (de target anterior a
    // algo distinto). Reemplaza el símbolo de reposo en la posición 0.
    const resting = strip[1] ?? pickRandom(SLOT_SYMBOLS).id;
    newStrip.push(resting);
    for (let i = 0; i < STRIP_PADDING_SYMBOLS; i++) {
      newStrip.push(pickRandom(SLOT_SYMBOLS).id);
    }
    newStrip.push(target);

    // Reset visual instantáneo a offsetY=0 con nueva strip.
    setTransitionActive(false);
    setStrip(newStrip);
    setOffsetY(0);

    // Next tick: activa transition y desplaza a la posición final.
    startTimer = window.setTimeout(() => {
      if (cancelled) return;
      setTransitionActive(true);
      // El target está en la ÚLTIMA posición de la strip. Para centrarlo en
      // la posición central del viewport (que muestra los símbolos en
      // índices 0,1,2 verticalmente, con 1 siendo el centro), necesitamos
      // desplazar (newStrip.length - 2) celdas — esto coloca el target en
      // el slot central y un símbolo aleatorio arriba y abajo.
      const cellsToAdvance = newStrip.length - 2;
      setOffsetY(-cellsToAdvance * CELL_H);
    }, Math.max(0, startDelayMs) + (firstSpinRef.current ? 0 : 20));
    firstSpinRef.current = false;

    // Un timer de seguridad por si onTransitionEnd no dispara (cancelación,
    // prefer-reduced-motion, cambio de ruta). Duración del giro + 250ms.
    endTimer = window.setTimeout(
      () => {
        if (cancelled) return;
        onLand?.();
      },
      Math.max(0, startDelayMs) + durationMs + 250,
    );

    return () => {
      cancelled = true;
      if (startTimer != null) window.clearTimeout(startTimer);
      if (endTimer != null) window.clearTimeout(endTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, target]);

  // Cuando ya no estamos girando y el target se fijó, colapsa la strip al
  // estado de reposo con el target en el centro. Evita mantener arrays
  // gigantes en memoria.
  useEffect(() => {
    if (isSpinning || target == null) return;
    const t = setTimeout(() => {
      setTransitionActive(false);
      setStrip([pickRandom(SLOT_SYMBOLS).id, target, pickRandom(SLOT_SYMBOLS).id]);
      setOffsetY(0);
    }, 60);
    return () => clearTimeout(t);
  }, [isSpinning, target]);

  const transitionCss = transitionActive
    ? `transform ${durationMs}ms cubic-bezier(0.15, 0.82, 0.25, 0.99) ${Math.max(0, startDelayMs)}ms`
    : "none";

  return (
    <div
      role="img"
      aria-label={
        ariaLabel ??
        (isSpinning
          ? "Rodillo girando"
          : `Rodillo en ${centerSymbol.name}`)
      }
      className="relative overflow-hidden rounded-xl bg-[--color-smoke]/85 ring-2 ring-inset ring-[--color-gold-500]/50 shadow-[inset_0_6px_18px_rgba(0,0,0,0.65)]"
      style={{
        width: "112px",
        height: `${CELL_H * 3}px`,
      }}
    >
      {/* Highlight overlay para la fila central (la que cuenta). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[96px] h-[96px] z-10 border-y-2 border-[--color-gold-400]/70 bg-gradient-to-b from-[--color-gold-500]/10 via-transparent to-[--color-gold-500]/10"
      />

      <div
        onTransitionEnd={(e) => {
          if (e.propertyName !== "transform") return;
          onLand?.();
        }}
        style={{
          transform: `translateY(${offsetY}px)`,
          transition: transitionCss,
          willChange: "transform",
        }}
      >
        {strip.map((id, i) => {
          const sym = symbolById(id);
          return (
            <div
              key={`${i}-${id}`}
              className={[
                "flex flex-col items-center justify-center select-none",
                toneBg(sym.tone),
              ].join(" ")}
              style={{ width: "112px", height: `${CELL_H}px` }}
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
                    className="h-14 w-14 rounded-md object-cover ring-1 ring-inset ring-white/25"
                  />
                </picture>
              ) : (
                <span
                  aria-hidden
                  className={[
                    "font-display leading-none select-none",
                    toneText(sym.tone),
                    sym.kind === "anti" ? "text-3xl" : "text-4xl font-black",
                  ].join(" ")}
                >
                  {sym.glyph}
                </span>
              )}
              <span
                className={[
                  "mt-1 font-label text-[0.55rem] tracking-[0.12em] uppercase",
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
