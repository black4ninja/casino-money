import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";

type Props = {
  /** One slide per child. Each child should be a Card component. */
  children: ReactNode[];
  /**
   * Optional section banner rendered above the slider. Gives the deck its
   * visual identity (Creacionales, Anti-patrones, etc.) so the user keeps
   * orientation while swiping through cards.
   */
  banner?: { avif: string; webp: string };
  bannerAlt?: string;
};

/**
 * One-card-at-a-time slider used for both design-patterns and anti-patterns.
 * Each slide takes the full width of the deck so the card gets every pixel
 * it can; swipe (touch) and drag (mouse) move to the next card, arrows give
 * keyboard/mouse access. Card tap is NOT consumed by the slider — embla
 * differentiates drag from tap by threshold, so tapping still flips the card.
 *
 * The deck itself has no vertical scroll: if a card back needs to scroll its
 * own long content (e.g. a code snippet), it does so locally, but the deck
 * never allows horizontal + vertical scroll to compete on the same surface.
 */
export function PatternsDeck({ children, banner, bannerAlt }: Props) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    loop: false,
    duration: 22,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [index, setIndex] = useState(0);

  const updateNav = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
    setIndex(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    updateNav();
    embla.on("select", updateNav);
    embla.on("reInit", updateNav);
    return () => {
      embla.off("select", updateNav);
      embla.off("reInit", updateNav);
    };
  }, [embla, updateNav]);

  const count = children.length;

  return (
    <div className="flex h-full flex-col gap-3">
      {banner && (
        <picture className="block shrink-0">
          <source srcSet={banner.avif} type="image/avif" />
          <source srcSet={banner.webp} type="image/webp" />
          <img
            src={banner.webp}
            alt={bannerAlt ?? ""}
            aria-hidden={bannerAlt ? undefined : true}
            draggable={false}
            className="mx-auto h-auto w-full max-w-md rounded-lg"
          />
        </picture>
      )}
      <div className="relative flex-1 min-h-0">
        {/* Arrows — large hit target, pinned outside the card on desktop. */}
        <button
          type="button"
          onClick={() => embla?.scrollPrev()}
          disabled={!canPrev}
          aria-label="Anterior"
          className="absolute left-0 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[--color-smoke]/85 p-3 text-[--color-gold-300] ring-1 ring-inset ring-[--color-gold-500]/40 backdrop-blur transition hover:text-[--color-ivory] disabled:pointer-events-none disabled:opacity-30 sm:flex"
        >
          <ChevronLeft />
        </button>
        <button
          type="button"
          onClick={() => embla?.scrollNext()}
          disabled={!canNext}
          aria-label="Siguiente"
          className="absolute right-0 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[--color-smoke]/85 p-3 text-[--color-gold-300] ring-1 ring-inset ring-[--color-gold-500]/40 backdrop-blur transition hover:text-[--color-ivory] disabled:pointer-events-none disabled:opacity-30 sm:flex"
        >
          <ChevronRight />
        </button>

        <div
          ref={emblaRef}
          className="h-full overflow-hidden"
          aria-roledescription="carousel"
        >
          <div className="flex h-full">
            {children.map((child, i) => (
              <div
                key={i}
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${count}`}
                className="flex h-full shrink-0 grow-0 basis-full items-center justify-center px-2 sm:px-3"
              >
                <div className="h-full w-full max-w-md">{child}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-center gap-1.5"
        role="tablist"
        aria-label="Posición en la serie"
      >
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Ir a la carta ${i + 1}`}
            onClick={() => embla?.scrollTo(i)}
            className={[
              "h-1.5 rounded-full transition-all",
              i === index
                ? "w-5 bg-[--color-gold-400]"
                : "w-1.5 bg-[--color-cream]/30 hover:bg-[--color-cream]/60",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2.25">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2.25">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
