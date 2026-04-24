type Props = {
  onClick: () => void;
};

/**
 * Poker-chip styled floating action button pinned to the bottom-right of the
 * viewport. Opens the patterns-and-antipatterns handbook for players. Uses
 * the same gold/felt vocabulary as the rest of the app; pure SVG so it scales
 * cleanly on any DPI.
 */
export function HandbookFab({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Abrir manual de patrones"
      className={[
        "fixed z-40",
        "bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)]",
        "h-16 w-16 rounded-full outline-none",
        "transition-transform duration-150 hover:scale-105 active:scale-95",
        "focus-visible:ring-4 focus-visible:ring-[--color-gold-400]/60",
        "drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)]",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 100 100"
        width={64}
        height={64}
        aria-hidden
        className="animate-chip-attention"
      >
        <defs>
          <radialGradient id="handbook-chip-grad" cx="50%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="60%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#3b0764" />
          </radialGradient>
          <radialGradient id="handbook-center-grad" cx="50%" cy="36%" r="62%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="55%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#581c87" />
          </radialGradient>
        </defs>
        {/* Edge dashes (8 gold hashes) */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i * 360) / 8;
          return (
            <rect
              key={i}
              x="47.5"
              y="2"
              width="5"
              height="13"
              rx="1.2"
              fill="#d4af37"
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}
        {/* Body */}
        <circle cx="50" cy="50" r="46" fill="url(#handbook-chip-grad)" />
        {/* Dashed inner ring */}
        <circle
          cx="50"
          cy="50"
          r="39"
          fill="none"
          stroke="#d4af37"
          strokeWidth="1"
          strokeDasharray="1.8 2.4"
        />
        {/* Center disc */}
        <circle cx="50" cy="50" r="26" fill="url(#handbook-center-grad)" />
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke="#0B1A14"
          strokeWidth="0.9"
        />
        {/* Book / handbook glyph */}
        <g transform="translate(50 50)">
          <path
            d="M -11 -9 h 9 a 3 3 0 0 1 3 3 v 14 a 3 3 0 0 0 -3 -3 h -9 z"
            fill="#d4af37"
            stroke="#8a6a10"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          <path
            d="M 11 -9 h -9 a 3 3 0 0 0 -3 3 v 14 a 3 3 0 0 1 3 -3 h 9 z"
            fill="#d4af37"
            stroke="#8a6a10"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          <line
            x1="0"
            y1="-6"
            x2="0"
            y2="8"
            stroke="#8a6a10"
            strokeWidth="0.8"
          />
        </g>
      </svg>
    </button>
  );
}
