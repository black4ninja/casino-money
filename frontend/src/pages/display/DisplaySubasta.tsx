import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { apiGetPublicAuction, type Auction } from "@/lib/auctionApi";
import type { ApiError } from "@/lib/authApi";

const POLL_MS = 1500;

function formatMxn(n: number): string {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * /display/casino/:casinoId/subasta — proyección pública (sin auth). Muestra
 * el valor actual enorme y el alias del pujador con paleta arriba. Poleo cada
 * 1.5s, igual que DisplayCarrera — barato porque la ruta pública responde
 * con un solo documento denormalizado (sin joins).
 */
export default function DisplaySubasta() {
  const { casinoId } = useParams<{ casinoId: string }>();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    if (!casinoId) {
      setError("URL inválida: falta casinoId");
      return;
    }
    let timer: number | null = null;
    const tick = async () => {
      try {
        const { auction } = await apiGetPublicAuction(casinoId);
        if (!aliveRef.current) return;
        setAuction(auction);
        setError(null);
      } catch (err) {
        if (!aliveRef.current) return;
        const e = err as ApiError;
        setError(e.message ?? "No se pudo cargar la subasta.");
      } finally {
        if (aliveRef.current) {
          timer = window.setTimeout(tick, POLL_MS);
        }
      }
    };
    tick();
    return () => {
      aliveRef.current = false;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [casinoId]);

  const currentBid = auction?.currentBid ?? 0;
  const hasInitial = currentBid > 0;

  return (
    <div
      className="landing-bg-fixed min-h-screen w-full overflow-x-hidden text-[--color-ivory]"
      style={{
        paddingInline: "clamp(1.5rem, 6vw, 10rem)",
        paddingBlock: "clamp(2rem, 5vw, 5rem)",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-1">
          <div className="font-label text-[0.7rem] tracking-[0.4em] text-[--color-gold-400]">
            CASINO · SUBASTA EN VIVO
          </div>
          <h1 className="gold-shine font-display text-3xl sm:text-5xl md:text-6xl leading-tight break-words">
            ✋ Subasta
          </h1>
          {auction && (
            <div className="font-label text-xs tracking-widest text-[--color-cream]/70">
              Ronda #{auction.roundNumber}
            </div>
          )}
        </header>

        {error && (
          <p
            role="alert"
            className="font-label text-sm tracking-wider text-[--color-carmine-400]"
          >
            {error}
          </p>
        )}

        <section className="flex flex-col items-center gap-6 rounded-3xl bg-black/40 px-8 py-16 ring-1 ring-inset ring-[--color-gold-500]/30 backdrop-blur-sm">
          <p className="font-label text-sm tracking-[0.5em] text-[--color-cream]/70">
            VALOR ACTUAL
          </p>
          {hasInitial ? (
            <div
              className="gold-shine font-display leading-none tracking-tight"
              style={{ fontSize: "clamp(4rem, 18vw, 14rem)" }}
            >
              {formatMxn(currentBid)}
            </div>
          ) : (
            <div
              className="font-display text-[--color-cream]/30 leading-none"
              style={{ fontSize: "clamp(4rem, 14vw, 10rem)" }}
            >
              —
            </div>
          )}
        </section>

        <section className="flex flex-col items-center gap-3 rounded-3xl bg-black/50 px-8 py-12 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
          <p className="font-label text-sm tracking-[0.5em] text-[--color-cream]/70">
            PALETA EN ALTO
          </p>
          {auction?.currentBidderAlias ? (
            <div
              className="font-display text-[--color-ivory] leading-tight text-center"
              style={{ fontSize: "clamp(2.5rem, 10vw, 8rem)" }}
            >
              {auction.currentBidderAlias}
            </div>
          ) : (
            <div
              className="font-display text-[--color-cream]/40 leading-tight text-center"
              style={{ fontSize: "clamp(2rem, 7vw, 5rem)" }}
            >
              {hasInitial ? "— sin paleta —" : "esperando al anunciador"}
            </div>
          )}
        </section>

        {/* Oferta firme previa — se muestra bajo el display principal
            cuando el anunciador subió el precio y nadie lo ha igualado. */}
        {auction?.lastConfirmedBidderAlias &&
          auction.lastConfirmedBid !== null && (
            <section className="flex flex-col items-center gap-2 rounded-2xl bg-black/40 px-6 py-6 ring-1 ring-inset ring-[--color-chip-blue-400]/40 backdrop-blur-sm">
              <p className="font-label text-xs tracking-[0.4em] text-[--color-chip-blue-300]">
                ÚLTIMA OFERTA EN FIRME
              </p>
              <div className="flex flex-wrap items-baseline justify-center gap-4">
                <span
                  className="font-display text-[--color-ivory] leading-tight"
                  style={{ fontSize: "clamp(1.5rem, 5vw, 3.5rem)" }}
                >
                  {auction.lastConfirmedBidderAlias}
                </span>
                <span
                  className="font-display text-[--color-gold-300] leading-tight"
                  style={{ fontSize: "clamp(1.25rem, 4vw, 3rem)" }}
                >
                  {formatMxn(auction.lastConfirmedBid)}
                </span>
              </div>
            </section>
          )}

        {/* Último vendido — snapshot histórico visible entre rondas. */}
        {auction?.lastSoldBidderAlias && auction.lastSoldBid !== null && (
          <section className="flex flex-col items-center gap-2 rounded-2xl bg-[--color-chip-green-500]/15 px-6 py-6 ring-1 ring-inset ring-[--color-chip-green-400]/50 backdrop-blur-sm">
            <p className="font-label text-xs tracking-[0.4em] text-[--color-chip-green-300]">
              ¡VENDIDO!
            </p>
            <div className="flex flex-wrap items-baseline justify-center gap-4">
              <span
                className="font-display text-[--color-ivory] leading-tight"
                style={{ fontSize: "clamp(1.75rem, 6vw, 4rem)" }}
              >
                {auction.lastSoldBidderAlias}
              </span>
              <span
                className="font-display text-[--color-gold-300] leading-tight"
                style={{ fontSize: "clamp(1.5rem, 5vw, 3.5rem)" }}
              >
                {formatMxn(auction.lastSoldBid)}
              </span>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
