import { NeonBulb } from "../atoms/NeonBulb";

const BULBS_PER_ROW = 14;

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
  return (
    <section
      aria-label="Casino Activity"
      className="animate-marquee-glow relative overflow-hidden rounded-[2rem] border-2 border-[--color-gold-500]/70 bg-black/25 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.55)] backdrop-blur-lg"
    >
      {/* Subtle inner highlight — mimics the top-edge reflection on glass. */}
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/5 via-transparent to-black/20" />
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-[--color-gold-500]/40" />

      <BulbRow />

      <div className="flex flex-col items-center gap-1 py-4 text-center">
        {/* Suits intercalated so the row alternates black→red→black→red;
            each suit carries its own shimmer palette (see .red-shine /
            .black-shine in casino-theme.css). */}
        <span
          aria-hidden
          className="font-display text-2xl tracking-[0.4em] sm:text-3xl"
        >
          <span className="black-shine">♠</span>
          {" "}
          <span className="red-shine">♥</span>
          {" "}
          <span className="black-shine">♣</span>
          {" "}
          <span className="red-shine">♦</span>
        </span>
        <h1 className="gold-shine font-display text-4xl font-black leading-none sm:text-5xl md:text-6xl">
          PATTERN CASINO
        </h1>
      </div>

      <BulbRow />
    </section>
  );
}
