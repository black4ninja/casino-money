import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";
import { ImageLightbox } from "../../molecules/ImageLightbox";
import {
  PATTERNS,
  CATEGORY_LABEL,
  patternImagePath,
} from "@/domain/designPatterns";
import type { RouletteSpin } from "@/lib/rouletteSpinApi";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  spin: RouletteSpin | null;
  loading: boolean;
  error: string | null;
  /** When true, the empty-state copy is worded for a player (passive
   *  observer) rather than the dealer (who operates the wheel). */
  viewerIsPlayer?: boolean;
};

/**
 * "Last spin at this mesa" panel — shared between the dealer mesa view
 * and the player mesa view. The data shape is the same in both cases; the
 * empty-state copy is the only thing that depends on who's looking.
 */
export function RuletaScoreView({ spin, loading, error, viewerIsPlayer }: Props) {
  const pattern = spin ? PATTERNS.find((p) => p.id === spin.patternId) : null;
  const imageSources = pattern ? patternImagePath(pattern) : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {error && (
        <Card tone="night" style={{ marginInline: 0 }}>
          <p
            className="font-label text-xs tracking-wider text-[--color-chip-red-300]"
            role="alert"
          >
            {error}
          </p>
        </Card>
      )}

      {!loading && !spin && !error && (
        <Card tone="felt" style={{ marginInline: 0 }} className="text-center">
          <p className="gold-shine font-display text-xl sm:text-2xl">
            Sin giros registrados
          </p>
          <p className="mt-2 font-label text-xs tracking-widest text-[--color-cream]/70">
            {viewerIsPlayer
              ? "En cuanto el dealer gire la ruleta, el resultado aparecerá aquí."
              : "El primer giro que hagas desde la pestaña Juego aparecerá aquí automáticamente."}
          </p>
        </Card>
      )}

      {spin && pattern && (
        <Card
          tone="felt"
          style={{ marginInline: 0 }}
          className="relative overflow-hidden ring-2 ring-inset ring-[--color-gold-500]/50"
        >
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-10">
            <div className="flex items-center justify-center">
              {imageSources ? (
                <ImageLightbox
                  sources={imageSources}
                  alt={`Ilustración del patrón ${pattern.name}`}
                  className="w-full max-w-md"
                >
                  <picture>
                    <source srcSet={imageSources.avif} type="image/avif" />
                    <source srcSet={imageSources.webp} type="image/webp" />
                    <img
                      src={imageSources.webp}
                      alt={`Ilustración del patrón ${pattern.name}`}
                      className="w-full rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] ring-2 ring-inset ring-[--color-gold-500]/40"
                    />
                  </picture>
                </ImageLightbox>
              ) : (
                <div className="flex aspect-square w-full max-w-md items-center justify-center rounded-2xl bg-[--color-smoke]/60 ring-2 ring-inset ring-[--color-gold-500]/40">
                  <span className="gold-shine font-display text-6xl">
                    {pattern.shortName}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 text-center md:text-left">
              <p className="font-label text-xs tracking-[0.35em] text-[--color-cream]/70 sm:text-sm">
                Casilla {pattern.displayNumber}
              </p>
              <h3 className="gold-shine font-display text-5xl font-black leading-[0.95] sm:text-6xl md:text-7xl">
                {pattern.name}
              </h3>
              <div className="flex justify-center md:justify-start">
                <Badge tone={pattern.tone} size="lg">
                  {CATEGORY_LABEL[pattern.category]}
                </Badge>
              </div>
              <p className="text-base leading-relaxed text-[--color-cream]/90 sm:text-lg">
                {pattern.description}
              </p>
              <p className="mt-2 font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
                Registrado {formatDateTime(spin.createdAt)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {spin && !pattern && (
        <Card tone="night" style={{ marginInline: 0 }}>
          <p className="font-label text-xs tracking-wider text-[--color-chip-red-300]">
            El último giro registrado ({spin.patternId}) no corresponde a
            ningún patrón del catálogo actual. Probablemente el catálogo cambió
            desde que se guardó.
          </p>
        </Card>
      )}
    </div>
  );
}
