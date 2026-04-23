import { useEffect, useMemo, useState } from "react";
import {
  PATTERNS,
  type DesignPattern,
  type PatternCategory,
} from "@/domain/designPatterns";
import { ANTI_PATTERNS } from "@/domain/antiPatterns";
import { PatternCard } from "../molecules/PatternCard";
import { AntiPatternCard } from "../molecules/AntiPatternCard";
import { PatternsDeck } from "./PatternsDeck";

type Category = Exclude<PatternCategory, "zero">;
type View =
  | { kind: "picker" }
  | { kind: "categories" }
  | { kind: "patterns-deck"; category: Category }
  | { kind: "antipatterns-deck" };

type Props = {
  open: boolean;
  onClose: () => void;
};

const BANNER_PATTERNS = {
  avif: "/images/banners/patterns.avif",
  webp: "/images/banners/patterns.webp",
};
const BANNER_ANTIPATTERNS = {
  avif: "/images/banners/antipatterns.avif",
  webp: "/images/banners/antipatterns.webp",
};

const CATEGORY_BANNERS: Record<
  Category,
  { avif: string; webp: string; alt: string; label: string }
> = {
  creational: {
    avif: "/images/banners/creational.avif",
    webp: "/images/banners/creational.webp",
    alt: "Patrones Creacionales",
    label: "Creacionales",
  },
  structural: {
    avif: "/images/banners/structural.avif",
    webp: "/images/banners/structural.webp",
    alt: "Patrones Estructurales",
    label: "Estructurales",
  },
  behavioral: {
    avif: "/images/banners/behavioral.avif",
    webp: "/images/banners/behavioral.webp",
    alt: "Patrones de Comportamiento",
    label: "Comportamiento",
  },
};

/**
 * Pocket handbook modal. Navigation is a shallow drill-down so the player
 * always has a clean "one screen at a time" view:
 *
 *   picker            → 2 banners: Patrones / Antipatrones
 *   categories        → 3 banners: Creacionales / Estructurales / Comportamiento
 *   patterns-deck     → single deck (1 card visible), horizontal swipe between cards
 *   antipatterns-deck → single deck
 *
 * We never stack multiple decks on the same screen — each deck gets the full
 * width of the modal so one card at a time can use it.
 */
export function HandbookModal({ open, onClose }: Props) {
  const [view, setView] = useState<View>({ kind: "picker" });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view.kind === "picker") onClose();
        else goBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, view, onClose]);

  useEffect(() => {
    if (!open) setView({ kind: "picker" });
  }, [open]);

  const patternsByCategory = useMemo(() => {
    const map: Record<Category, DesignPattern[]> = {
      creational: [],
      structural: [],
      behavioral: [],
    };
    for (const p of PATTERNS) {
      if (p.category === "zero") continue;
      map[p.category].push(p);
    }
    for (const k of Object.keys(map) as Category[]) {
      map[k].sort((a, b) => a.boardNumber - b.boardNumber);
    }
    return map;
  }, []);

  function goBack() {
    if (view.kind === "patterns-deck") setView({ kind: "categories" });
    else if (view.kind === "antipatterns-deck") setView({ kind: "picker" });
    else if (view.kind === "categories") setView({ kind: "picker" });
    else onClose();
  }

  if (!open) return null;

  const totalPatterns = PATTERNS.filter((p) => p.category !== "zero").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-6 sm:py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Manual de patrones"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div className="relative z-10 flex max-h-full w-full max-w-3xl animate-chip-pop flex-col overflow-hidden rounded-2xl bg-[--color-felt-900] ring-2 ring-inset ring-[--color-gold-500]/50 shadow-[0_30px_80px_rgba(0,0,0,0.7)]">
        <header className="flex items-center justify-between gap-3 border-b border-[--color-gold-500]/20 bg-[--color-smoke]/60 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            {view.kind !== "picker" && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 font-label text-[0.7rem] uppercase tracking-[0.22em] text-[--color-gold-300] transition hover:text-[--color-ivory]"
              >
                <svg
                  viewBox="0 0 24 24"
                  width={14}
                  height={14}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Volver
              </button>
            )}
            <h2 className="gold-shine font-display text-xl leading-tight sm:text-2xl">
              {view.kind === "picker" && "Manual de patrones"}
              {view.kind === "categories" && "Patrones de diseño"}
              {view.kind === "patterns-deck" &&
                `Patrones · ${CATEGORY_BANNERS[view.category].label}`}
              {view.kind === "antipatterns-deck" && "Anti-patrones"}
            </h2>
            <p className="font-label text-[0.6rem] uppercase tracking-[0.28em] text-[--color-cream]/65">
              {view.kind === "picker" && "Elegí una sección"}
              {view.kind === "categories" &&
                `${totalPatterns} patrones en 3 familias`}
              {view.kind === "patterns-deck" &&
                `${patternsByCategory[view.category].length} cartas`}
              {view.kind === "antipatterns-deck" &&
                `${ANTI_PATTERNS.length} cartas`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[--color-gold-500]/50 bg-[--color-smoke]/70 text-xl leading-none text-[--color-cream]/85 transition hover:border-[--color-gold-400] hover:text-[--color-ivory] sm:h-10 sm:w-10"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          {view.kind === "picker" && (
            <div className="grid h-full content-center gap-4 sm:grid-cols-2">
              <PickerCard
                banner={BANNER_PATTERNS}
                alt="Patrones de diseño"
                caption="23 patrones con UML, casos y código"
                onClick={() => setView({ kind: "categories" })}
              />
              <PickerCard
                banner={BANNER_ANTIPATTERNS}
                alt="Anti-patrones"
                caption="Errores comunes y cómo evitarlos"
                onClick={() => setView({ kind: "antipatterns-deck" })}
              />
            </div>
          )}

          {view.kind === "categories" && (
            <div className="grid h-full content-center gap-3 sm:grid-cols-3">
              {(Object.keys(CATEGORY_BANNERS) as Category[]).map((cat) => (
                <PickerCard
                  key={cat}
                  banner={{
                    avif: CATEGORY_BANNERS[cat].avif,
                    webp: CATEGORY_BANNERS[cat].webp,
                  }}
                  alt={CATEGORY_BANNERS[cat].alt}
                  caption={`${patternsByCategory[cat].length} patrones`}
                  onClick={() => setView({ kind: "patterns-deck", category: cat })}
                />
              ))}
            </div>
          )}

          {view.kind === "patterns-deck" && (
            <PatternsDeck
              banner={{
                avif: CATEGORY_BANNERS[view.category].avif,
                webp: CATEGORY_BANNERS[view.category].webp,
              }}
              bannerAlt={CATEGORY_BANNERS[view.category].alt}
            >
              {patternsByCategory[view.category].map((p) => (
                <PatternCard key={p.id} pattern={p} />
              ))}
            </PatternsDeck>
          )}

          {view.kind === "antipatterns-deck" && (
            <PatternsDeck
              banner={BANNER_ANTIPATTERNS}
              bannerAlt="Anti-patrones"
            >
              {ANTI_PATTERNS.map((ap) => (
                <AntiPatternCard key={ap.id} antiPattern={ap} />
              ))}
            </PatternsDeck>
          )}
        </div>
      </div>
    </div>
  );
}

function PickerCard({
  banner,
  alt,
  caption,
  onClick,
}: {
  banner: { avif: string; webp: string };
  alt: string;
  caption: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-[--color-smoke]/60 ring-2 ring-inset ring-[--color-gold-500]/40 shadow-[0_14px_40px_rgba(0,0,0,0.55)] transition hover:ring-[--color-gold-400] hover:shadow-[0_18px_48px_rgba(0,0,0,0.7)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[--color-gold-400]/70"
    >
      <picture className="block">
        <source srcSet={banner.avif} type="image/avif" />
        <source srcSet={banner.webp} type="image/webp" />
        <img
          src={banner.webp}
          alt={alt}
          draggable={false}
          loading="eager"
          decoding="async"
          className="block h-auto w-full transition-transform duration-500 group-hover:scale-[1.02]"
        />
      </picture>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-3 pt-10">
        <p className="font-label text-[0.68rem] uppercase tracking-[0.25em] text-[--color-cream]/90">
          {caption}
        </p>
      </div>
    </button>
  );
}
