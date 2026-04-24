import { useState } from "react";
import {
  patternImagePath,
  type DesignPattern,
} from "@/domain/designPatterns";
import { PATTERN_HANDBOOK } from "@/domain/patternHandbook";
import { MermaidDiagram } from "./MermaidDiagram";
import { CodeBlock } from "./CodeBlock";
import { ImageLightboxModal } from "./ImageLightbox";
import { Button } from "@/components/atoms/Button";

type BackTab = "uml" | "uses" | "code";

type Props = {
  pattern: DesignPattern;
};

const TAB_LABELS: Record<BackTab, string> = {
  uml: "UML",
  uses: "Casos",
  code: "Código",
};

/**
 * Flip-card rendering a single design pattern. Front = the optimized artwork
 * (which already embeds all the visual identity: name, description, UML,
 * quote) at full size with no overlay. Back = tabbed handbook content (UML,
 * use cases, JS code). Tapping anywhere toggles the orientation; interactive
 * children on the back stopPropagation so they don't re-flip by accident.
 */
export function PatternCard({ pattern }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [tab, setTab] = useState<BackTab>("uml");
  const [zoomOpen, setZoomOpen] = useState(false);
  const sources = patternImagePath(pattern);
  const handbook = PATTERN_HANDBOOK[pattern.id];

  return (
    <div className="group relative h-full min-h-[460px] w-full select-none [perspective:1400px]">
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={`${flipped ? "Ver frente" : "Ver reverso"} del patrón ${pattern.name}`}
        aria-pressed={flipped}
        className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]"
      >
        <div
          className="relative h-full w-full rounded-2xl transition-transform duration-700 [transform-style:preserve-3d]"
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* FRONT — just the art. The images are designed as self-contained
              pattern cards (title, description, UML, quote) so we don't add
              any overlay or hint; letting them breathe looks better. */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-black [backface-visibility:hidden]">
            {sources ? (
              <picture>
                <source srcSet={sources.avif} type="image/avif" />
                <source srcSet={sources.webp} type="image/webp" />
                <img
                  src={sources.webp}
                  alt={`Carta del patrón ${pattern.name}`}
                  draggable={false}
                  className="h-full w-full object-contain"
                />
              </picture>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[--color-smoke]">
                <span className="gold-shine font-display text-5xl">
                  {pattern.shortName}
                </span>
              </div>
            )}
          </div>

          {/* BACK */}
          <div className="absolute inset-0 overflow-hidden rounded-2xl bg-[--color-felt-900] ring-2 ring-inset ring-[--color-gold-500]/50 shadow-[0_14px_40px_rgba(0,0,0,0.55)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col">
              <header className="border-b border-[--color-gold-500]/20 bg-[--color-smoke]/60 px-4 py-3">
                <p className="font-label text-[0.55rem] uppercase tracking-[0.3em] text-[--color-gold-400]">
                  {categoryLabel(pattern.category)}
                </p>
                <p className="gold-shine font-display text-lg leading-tight">
                  {pattern.name}
                </p>
              </header>

              {/* Tab picker — stopPropagation so tapping a tab doesn't flip the card. */}
              <div
                role="tablist"
                className="flex gap-1 border-b border-[--color-gold-500]/20 bg-[--color-smoke]/40 px-2 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                {(Object.keys(TAB_LABELS) as BackTab[]).map((k) => {
                  const active = tab === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={(e) => {
                        e.stopPropagation();
                        setTab(k);
                      }}
                      className={[
                        "flex-1 rounded-full px-3 py-1.5 font-label text-[0.68rem] uppercase tracking-[0.18em] transition",
                        active
                          ? "bg-gradient-to-b from-[--color-gold-300] to-[--color-gold-500] text-[--color-smoke] shadow-[inset_0_0_0_2px_var(--color-gold-400),0_2px_0_#8A6A10]"
                          : "text-[--color-cream]/70 hover:text-[--color-cream] hover:bg-white/5",
                      ].join(" ")}
                    >
                      {TAB_LABELS[k]}
                    </button>
                  );
                })}
              </div>

              <div
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 text-left [scrollbar-width:thin] [scrollbar-color:var(--color-gold-500)_transparent]"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {handbook ? (
                  <>
                    {tab === "uml" && (
                      <MermaidDiagram
                        source={handbook.umlMermaid}
                        label={`Diagrama UML del patrón ${pattern.name}`}
                      />
                    )}
                    {tab === "uses" && (
                      <ul className="space-y-2.5 text-[0.82rem] leading-snug text-[--color-cream]/90">
                        {handbook.useCases.map((u, i) => (
                          <li key={i} className="flex gap-2.5">
                            <span
                              aria-hidden
                              className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[--color-gold-400]"
                            />
                            <span>{u}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {tab === "code" && <CodeBlock code={handbook.codeJs} />}
                  </>
                ) : (
                  <p className="font-label text-xs tracking-wider text-[--color-cream]/60">
                    Sin contenido adicional todavía.
                  </p>
                )}
              </div>

              {sources && (
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
              )}
            </div>
          </div>
        </div>
      </button>

      {sources && (
        <ImageLightboxModal
          sources={sources}
          alt={`Carta del patrón ${pattern.name}`}
          open={zoomOpen}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  );
}

function categoryLabel(cat: DesignPattern["category"]): string {
  switch (cat) {
    case "creational":
      return "Creacional";
    case "structural":
      return "Estructural";
    case "behavioral":
      return "Comportamiento";
    case "zero":
      return "Cero";
  }
}
