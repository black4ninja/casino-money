import { CHIP_STYLES, type Denomination } from "@/domain/denominations";

type Props = {
  denom: Denomination;
  size?: number;
  count?: number;
  label?: string;
  onClick?: () => void;
  selected?: boolean;
};

export function Chip({
  denom,
  size = 72,
  count,
  label,
  onClick,
  selected,
}: Props) {
  const s = CHIP_STYLES[denom];
  const ringInset = size * 0.14;
  const hashCount = 8;
  const interactive = onClick !== undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-label={`Ficha de ${denom}${count && count > 1 ? `, x${count}` : ""}`}
      className={[
        "relative shrink-0 transition-transform duration-150",
        interactive ? "cursor-pointer hover:scale-105 active:scale-95" : "cursor-default",
        selected ? "scale-110 drop-shadow-[0_0_12px_rgba(212,175,55,0.7)]" : "",
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
        <defs>
          <radialGradient id={`chip-grad-${denom}`} cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor={lighten(s.body, 0.2)} />
            <stop offset="100%" stopColor={s.body} />
          </radialGradient>
        </defs>
        {/* Edge dashes */}
        {Array.from({ length: hashCount }, (_, i) => {
          const angle = (i * 360) / hashCount;
          return (
            <rect
              key={i}
              x="48"
              y="2"
              width="4"
              height="12"
              rx="1.2"
              fill={s.edge}
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}
        {/* Main body */}
        <circle cx="50" cy="50" r="46" fill={`url(#chip-grad-${denom})`} />
        {/* Inner ring */}
        <circle
          cx="50"
          cy="50"
          r={46 - ringInset}
          fill="none"
          stroke={s.accent}
          strokeWidth="1.2"
          strokeDasharray="1.5 2"
        />
        {/* Center disc */}
        <circle cx="50" cy="50" r="26" fill={lighten(s.body, 0.08)} />
        <circle
          cx="50"
          cy="50"
          r="26"
          fill="none"
          stroke={s.accent}
          strokeWidth="0.8"
        />
        {/* Denom text */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fontFamily="Bebas Neue, Impact, sans-serif"
          fontSize={denom >= 1000 ? 16 : 20}
          fill={s.text}
          fontWeight="700"
        >
          ${denom}
        </text>
      </svg>
      {count !== undefined && count > 1 && (
        <span
          className="absolute -right-1 -top-1 rounded-full border border-[--color-smoke] bg-[--color-gold-500] px-1.5 text-xs font-bold text-[--color-smoke]"
          aria-hidden
        >
          ×{count}
        </span>
      )}
      {label && (
        <span className="mt-1 block text-center font-label text-xs text-[--color-cream]/80">
          {label}
        </span>
      )}
    </button>
  );
}

function lighten(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
  const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}
