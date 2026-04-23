import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";

type Props = {
  /** Full-resolution source shown inside the modal. */
  src: string;
  /** Alt for both the trigger and the enlarged copy. */
  alt: string;
  /**
   * The clickable trigger — typically the `<img>` already styled for the
   * surrounding layout. Wrapping it in the lightbox adds click + keyboard
   * open semantics without touching the child's styling.
   */
  children: ReactNode;
  /** Extra classes for the trigger button wrapper. */
  className?: string;
};

/**
 * Click-to-expand image viewer. Shows the child in place; on click/tap it
 * opens a full-viewport modal where the user can toggle 2× zoom. While
 * zoomed, the transform origin follows the pointer so moving the cursor
 * acts as a panning gesture (no drag event wiring needed). ESC, backdrop
 * click, or the × button close it.
 *
 * Reusable for any image that benefits from a detail view (score, rules
 * diagrams, pattern cards, future tutorials). Keep the wrapping <img>'s
 * styling inside `children` — the lightbox only touches trigger affordances.
 */
export function ImageLightbox({ src, alt, children, className }: Props) {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const originRef = useRef<HTMLImageElement | null>(null);
  const [origin, setOrigin] = useState<{ x: string; y: string }>({
    x: "50%",
    y: "50%",
  });

  const close = useCallback(() => {
    setOpen(false);
    setZoomed(false);
    setOrigin({ x: "50%", y: "50%" });
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  function updateOriginFromPoint(clientX: number, clientY: number) {
    const el = originRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 100;
    const y = ((clientY - r.top) / r.height) * 100;
    setOrigin({
      x: `${Math.min(100, Math.max(0, x))}%`,
      y: `${Math.min(100, Math.max(0, y))}%`,
    });
  }

  function onMouseMove(e: ReactMouseEvent<HTMLImageElement>) {
    if (!zoomed) return;
    updateOriginFromPoint(e.clientX, e.clientY);
  }

  function onTouchMove(e: ReactTouchEvent<HTMLImageElement>) {
    if (!zoomed) return;
    const t = e.touches[0];
    if (!t) return;
    updateOriginFromPoint(t.clientX, t.clientY);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar imagen: ${alt}`}
        className={[
          "block w-full cursor-zoom-in transition",
          "hover:brightness-110 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-[--color-gold-400] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]",
          "rounded-2xl",
          className ?? "",
        ].join(" ")}
      >
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={close}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative z-10 flex max-h-full max-w-full items-center justify-center">
            <img
              ref={originRef}
              src={src}
              alt={alt}
              draggable={false}
              onClick={() => setZoomed((z) => !z)}
              onMouseMove={onMouseMove}
              onTouchMove={onTouchMove}
              onMouseLeave={() => setOrigin({ x: "50%", y: "50%" })}
              className={[
                "block max-h-[90vh] max-w-[95vw] select-none",
                "transition-transform duration-200 ease-out",
                "rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)]",
                zoomed ? "scale-[2] cursor-zoom-out" : "scale-100 cursor-zoom-in",
              ].join(" ")}
              style={{ transformOrigin: `${origin.x} ${origin.y}` }}
            />

            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-[--color-gold-500]/50 bg-[--color-smoke]/80 text-xl leading-none text-[--color-cream]/90 transition hover:border-[--color-gold-400] hover:text-[--color-ivory] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]"
            >
              ×
            </button>
          </div>

          <p
            aria-hidden
            className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55"
          >
            {zoomed ? "MOVÉ EL CURSOR PARA EXPLORAR · CLIC PARA ALEJAR" : "CLIC PARA HACER ZOOM"}
          </p>
        </div>
      )}
    </>
  );
}
