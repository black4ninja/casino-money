import { useState } from "react";
import {
  antiPatternImagePath,
  type AntiPattern,
} from "@/domain/antiPatterns";
import { ImageLightboxModal } from "./ImageLightbox";
import { Button } from "@/components/atoms/Button";

type Props = {
  antiPattern: AntiPattern;
};

/**
 * Flip card for an anti-pattern. Mirrors PatternCard: the front is the
 * self-contained artwork (no overlay), the back is the written reference —
 * tagline, description, concrete examples students run into, and how to
 * pivot out of it. No UML and no code by design; anti-patterns are learned
 * from examples, not from formal structure.
 */
export function AntiPatternCard({ antiPattern }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const sources = antiPatternImagePath(antiPattern);

  return (
    <div className="group relative h-full min-h-[460px] w-full select-none [perspective:1400px]">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={`${flipped ? "Ver frente" : "Ver reverso"} del anti-patrón ${antiPattern.name}`}
        aria-pressed={flipped}
        className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]"
      >
        <div
          className="relative h-full w-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* FRONT — just the art, no overlay. */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-black [backface-visibility:hidden]">
            <picture>
              <source srcSet={sources.avif} type="image/avif" />
              <source srcSet={sources.webp} type="image/webp" />
              <img
                src={sources.webp}
                alt={`Carta del anti-patrón ${antiPattern.name}`}
                draggable={false}
                className="h-full w-full object-contain"
              />
            </picture>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[--color-felt-900] ring-2 ring-inset ring-[--color-gold-500]/50 shadow-[0_14px_40px_rgba(0,0,0,0.55)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col">
              <header className="border-b border-[--color-gold-500]/20 bg-[--color-smoke]/60 px-4 py-3">
                <p className="font-label text-[0.55rem] uppercase tracking-[0.3em] text-[--color-chip-red-300]">
                  Anti-patrón
                </p>
                <p className="gold-shine font-display text-lg leading-tight">
                  {antiPattern.name}
                </p>
                <p className="mt-1 font-sans text-[0.72rem] italic leading-snug text-[--color-cream]/80">
                  {antiPattern.tagline}
                </p>
              </header>

              <div
                className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 text-left [scrollbar-width:thin] [scrollbar-color:var(--color-gold-500)_transparent]"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <p className="text-[0.82rem] leading-snug text-[--color-cream]/90">
                  {antiPattern.description}
                </p>
                <section>
                  <h3 className="font-label text-[0.6rem] uppercase tracking-[0.25em] text-[--color-gold-400]">
                    Ejemplos que verás
                  </h3>
                  <ul className="mt-2 space-y-2 text-[0.78rem] leading-snug text-[--color-cream]/85">
                    {antiPattern.examples.map((e, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span
                          aria-hidden
                          className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[--color-chip-red-400]"
                        />
                        <span>{e}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="font-label text-[0.6rem] uppercase tracking-[0.25em] text-[--color-gold-400]">
                    Cómo salir
                  </h3>
                  <ul className="mt-2 space-y-2 text-[0.78rem] leading-snug text-[--color-cream]/85">
                    {antiPattern.remedies.map((r, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span
                          aria-hidden
                          className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[--color-gold-400]"
                        />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <footer
                className="border-t border-[--color-gold-500]/20 bg-[--color-smoke]/60 px-4 py-3"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Button
                  variant="info"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomOpen(true);
                  }}
                >
                  Ver imagen
                </Button>
              </footer>
            </div>
          </div>
        </div>
      </button>

      <ImageLightboxModal
        sources={sources}
        alt={`Carta del anti-patrón ${antiPattern.name}`}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </div>
  );
}
