import { useEffect, useRef, useState } from "react";
import { NeonBulb } from "../atoms/NeonBulb";

const BULBS_PER_ROW = 14;
const COIN_AUDIO_SRC = "/audio/coin-flip.mp3";

function BulbRow() {
  return (
    <div className="flex items-center justify-between px-1" aria-hidden>
      {Array.from({ length: BULBS_PER_ROW }).map((_, i) => (
        <NeonBulb key={i} delay={(i % 5) * 180} />
      ))}
    </div>
  );
}

export function CasinoSign() {
  const [spinning, setSpinning] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const coinAudioRef = useRef<HTMLAudioElement | null>(null);

  // Precarga del efecto de moneda para que el primer click no tenga
  // retardo de red al reproducirse junto con la animación.
  useEffect(() => {
    const a = new Audio(COIN_AUDIO_SRC);
    a.preload = "auto";
    coinAudioRef.current = a;
    return () => {
      a.pause();
      coinAudioRef.current = null;
    };
  }, []);

  function handleSpin() {
    if (spinning) return;
    const audio = coinAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    setSpinKey((k) => k + 1);
    setSpinning(true);
  }

  return (
    <div className="relative mt-16 md:mt-20">
      {/* Medallón Pattern Casino — centrado en el outline superior:
          3/4 arriba del panel, 1/4 sobre el borde de oro para un
          efecto "fusionado" tipo plaqueta. Al hacer click gira 1s
          (2 vueltas) alineado con el efecto de sonido moneda. */}
      <button
        type="button"
        onClick={handleSpin}
        disabled={spinning}
        aria-label="Girar medallón Pattern Casino"
        className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-3/4 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[--color-gold-400]/70 disabled:cursor-default"
        style={{ perspective: "1200px" }}
      >
        <img
          key={`casinosign-medallion-${spinKey}`}
          src="/web-app-manifest-512x512.png"
          alt="Pattern Casino"
          draggable={false}
          onAnimationEnd={() => setSpinning(false)}
          className={[
            "block h-20 w-20 rounded-full border-2 border-[--color-gold-500]/80 bg-[--color-felt-900] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.6),_0_0_20px_rgba(212,175,55,0.35)] sm:h-24 sm:w-24",
            spinning ? "animate-coin-flip" : "",
          ].join(" ")}
          style={{ backfaceVisibility: "visible" }}
        />
      </button>
      <section
        aria-label="Casino Activity"
        className="animate-marquee-glow relative overflow-hidden rounded-[2rem] border-2 border-[--color-gold-500]/70 bg-black/25 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-lg"
      >
        {/* Subtle inner highlight — mimics the top-edge reflection on glass. */}
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/5 via-transparent to-black/20" />
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[--color-gold-500]/40" />

        <BulbRow />

        <div className="flex flex-col items-center gap-1 py-4 text-center">
          <h1 className="gold-shine font-display text-4xl font-black leading-none sm:text-5xl md:text-6xl">
            PATTERN CASINO
          </h1>
          {/* Suits row reversed — palos ordenados ♦ ♣ ♥ ♠ (red→black→red→black);
              each suit carries its own shimmer palette (see .red-shine /
              .black-shine in casino-theme.css). */}
          <span
            aria-hidden
            className="font-display text-2xl tracking-[0.4em] sm:text-3xl"
          >
            <span className="red-shine">♦</span>
            {" "}
            <span className="black-shine">♣</span>
            {" "}
            <span className="red-shine">♥</span>
            {" "}
            <span className="black-shine">♠</span>
          </span>
        </div>

        <BulbRow />
      </section>
    </div>
  );
}
