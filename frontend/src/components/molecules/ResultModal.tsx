import { useEffect } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Badge } from "../atoms/Badge";
import { NeonBulb } from "../atoms/NeonBulb";
import {
  CATEGORY_LABEL,
  type DesignPattern,
} from "@/domain/designPatterns";

type Props = {
  pattern: DesignPattern | null;
  open: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
};

/**
 * Victory-style result modal — slot-machine reveal aesthetic.
 *
 * Composition notes:
 *  - Backdrop uses a dimmed dark overlay so the felt-weave behind shows
 *    through softly (doesn't fully black out).
 *  - Card enters with `animate-chip-pop` (existing: scale + slight rotate
 *    bounce) — reuses the celebratory feel already in the codebase.
 *  - Gold border pulses via `animate-marquee-glow`.
 *  - Row of NeonBulbs above the card evokes a marquee payout banner.
 *  - No new keyframes added — all polish comes from existing animations.
 */
export function ResultModal({ pattern, open, onClose, onSpinAgain }: Props) {
  // ESC to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !pattern) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-modal-title"
    >
      {/* Backdrop — tap anywhere outside to dismiss. */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      {/* Card + bulb row, together so they feel like one payout module. */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-stretch gap-3 animate-chip-pop">
        {/* Top marquee strip of blinking bulbs. */}
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
          {/* "CAYÓ" banner */}
          <div className="-mx-5 -mt-5 mb-4 bg-gradient-to-b from-[--color-gold-300] via-[--color-gold-400] to-[--color-gold-500] py-2 text-center shadow-[inset_0_-3px_0_rgba(138,106,16,0.5)]">
            <p className="font-label text-sm tracking-[0.35em] text-[--color-smoke]">
              ★ ¡CAYÓ! ★
            </p>
          </div>

          <div className="text-center">
            <p className="font-label text-xs tracking-widest text-[--color-cream]/70">
              Patrón seleccionado
            </p>
            <h2
              id="result-modal-title"
              className="gold-shine mt-2 font-display text-4xl font-black leading-tight sm:text-5xl"
            >
              {pattern.name}
            </h2>
            <div className="mt-4 flex justify-center">
              <Badge tone={pattern.tone}>
                {CATEGORY_LABEL[pattern.category]}
              </Badge>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-[--color-cream]/85">
              {pattern.description}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            <Button variant="gold" onClick={onSpinAgain} autoFocus>
              Girar de nuevo
            </Button>
          </div>
        </Card>

        {/* Bottom marquee strip mirrors the top. */}
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
