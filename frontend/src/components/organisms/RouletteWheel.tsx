import { useState, type CSSProperties } from "react";
import {
  PATTERNS,
  PATTERN_COUNT,
  type DesignPattern,
} from "@/domain/designPatterns";

const SLOT_ANGLE = 360 / PATTERN_COUNT;
const R_INNER = 82;
const R_OUTER = 198;
const R_RIM_IN = 202;
const R_RIM_OUT = 220;
const R_HUB = 74;
const R_LABEL = 148;
const BULB_COUNT = 16;
const R_BULB = 232;

function polar(r: number, deg: number): { x: number; y: number } {
  const rad = (deg * Math.PI) / 180;
  return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
}

/**
 * Annular slice centered at local angle 0°, spanning [−half, +half].
 * This is rendered inside a `<g transform="rotate(θ)">` so we don't have to
 * bake the target angle into the path data.
 */
function annularSlice(rIn: number, rOut: number, halfAngleDeg: number): string {
  const a1 = polar(rIn, -halfAngleDeg);
  const a2 = polar(rOut, -halfAngleDeg);
  const b2 = polar(rOut, halfAngleDeg);
  const b1 = polar(rIn, halfAngleDeg);
  return `M ${a1.x.toFixed(3)} ${a1.y.toFixed(3)} L ${a2.x.toFixed(3)} ${a2.y.toFixed(3)} A ${rOut} ${rOut} 0 0 1 ${b2.x.toFixed(3)} ${b2.y.toFixed(3)} L ${b1.x.toFixed(3)} ${b1.y.toFixed(3)} A ${rIn} ${rIn} 0 0 0 ${a1.x.toFixed(3)} ${a1.y.toFixed(3)} Z`;
}

const SLICE_PATH = annularSlice(R_INNER, R_OUTER, SLOT_ANGLE / 2);

type ToneKey = DesignPattern["tone"];
const TONE_TEXT: Record<ToneKey, string> = {
  gold: "#1a1a1a",
  info: "#ffffff",
  danger: "#ffffff",
  success: "#ffffff",
};

type Props = {
  /** Accumulated rotation in degrees (never resets across spins). */
  rotation: number;
  /** Skip the spin transition — used for prefers-reduced-motion. */
  instant?: boolean;
  /** Spin duration in ms. */
  durationMs?: number;
  /** Fires when the transform transition ends. */
  onSpinEnd?: () => void;
  /** Fires when the user clicks/taps the hub. */
  onSpin?: () => void;
  /** Disables the hub click (during spin). */
  disabled?: boolean;
  ariaLabel?: string;
};

export function RouletteWheel({
  rotation,
  instant = false,
  durationMs = 5500,
  onSpinEnd,
  onSpin,
  disabled,
  ariaLabel,
}: Props) {
  const [pressed, setPressed] = useState(false);
  // SVG rotation quirk: we need `transform-box: fill-box` + `transform-origin:
  // center` so the rotation pivots on the wheel's actual center (which in our
  // SVG happens to be the (0,0) coordinate, but CSS transforms without these
  // properties would pivot on the element's top-left in bbox space).
  const spinStyle: CSSProperties = {
    transform: `rotate(${rotation}deg)`,
    transformBox: "fill-box",
    transformOrigin: "center",
    transition: instant
      ? "none"
      : `transform ${durationMs}ms cubic-bezier(0.15, 0.82, 0.25, 0.99)`,
  };

  return (
    <div
      className="relative mx-auto select-none [touch-action:manipulation]"
      role="img"
      aria-label={ariaLabel}
      style={{ width: "100%", maxWidth: "min(92vw, 82vh, 720px)" }}
    >
      <svg
        viewBox="-250 -250 500 500"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-marquee-glow"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <defs>
          <linearGradient id="rw-grad-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gold-300)" />
            <stop offset="100%" stopColor="var(--color-gold-500)" />
          </linearGradient>
          <linearGradient id="rw-grad-info" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chip-blue-400)" />
            <stop offset="100%" stopColor="var(--color-chip-blue-500)" />
          </linearGradient>
          <linearGradient id="rw-grad-danger" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chip-red-400)" />
            <stop offset="100%" stopColor="var(--color-chip-red-500)" />
          </linearGradient>
          <linearGradient id="rw-grad-success" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chip-green-400)" />
            <stop offset="100%" stopColor="var(--color-chip-green-500)" />
          </linearGradient>
          <radialGradient id="rw-grad-hub" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fff8e4" />
            <stop offset="40%" stopColor="var(--color-gold-300)" />
            <stop offset="100%" stopColor="var(--color-gold-500)" />
          </radialGradient>
          <radialGradient id="rw-grad-rim" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-gold-300)" />
            <stop offset="70%" stopColor="var(--color-gold-500)" />
            <stop offset="100%" stopColor="#8a6a10" />
          </radialGradient>
          <filter id="rw-bevel" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="4" result="offset" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.55" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="rw-bulb-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="rw-grad-felt" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="var(--color-felt-700)" />
            <stop offset="100%" stopColor="var(--color-felt-900)" />
          </radialGradient>
        </defs>

        {/* Outer bezel / rim */}
        <circle
          cx="0"
          cy="0"
          r={R_RIM_OUT}
          fill="url(#rw-grad-rim)"
          filter="url(#rw-bevel)"
        />
        <circle cx="0" cy="0" r={R_RIM_IN} fill="url(#rw-grad-felt)" />

        {/* Rotating wheel: slices + dividers + labels */}
        <g
          style={spinStyle}
          onTransitionEnd={(e) => {
            if (e.propertyName === "transform") onSpinEnd?.();
          }}
        >
          {PATTERNS.map((pattern, i) => {
            const centerAngle = i * SLOT_ANGLE - 90;
            // Text runs along the radial direction (letter width = slice depth,
            // letter height = slice tangential span). For slots on the far half
            // of the wheel (where cos < 0), a 180° flip keeps the text right
            // side up for a viewer looking at the screen.
            const needsFlip =
              Math.cos((centerAngle * Math.PI) / 180) < 0;
            return (
              <g
                key={pattern.id}
                transform={`rotate(${centerAngle.toFixed(4)})`}
              >
                <path
                  d={SLICE_PATH}
                  fill={`url(#rw-grad-${pattern.tone})`}
                  stroke="var(--color-gold-500)"
                  strokeWidth="1"
                  strokeOpacity="0.65"
                />
                <text
                  x={R_LABEL}
                  y="0"
                  transform={
                    needsFlip ? `rotate(180 ${R_LABEL} 0)` : undefined
                  }
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={TONE_TEXT[pattern.tone]}
                  className="font-label"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                  }}
                >
                  {pattern.shortName}
                </text>
              </g>
            );
          })}
        </g>

        {/* Hub (static collar — sits above rotating slices). */}
        <circle
          cx="0"
          cy="0"
          r={R_INNER}
          fill="var(--color-smoke-800)"
          stroke="var(--color-gold-500)"
          strokeWidth="1.5"
        />

        {/* Clickable hub button: scales down on press for a physical feel.
            Tapping it triggers the spin. Entire group acts as one target so
            the whole hub area (not just the text) is tappable. */}
        <g
          style={{
            transform: pressed && !disabled ? "scale(0.88)" : "scale(1)",
            transformBox: "fill-box",
            transformOrigin: "center",
            transition: "transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            cursor: disabled ? "default" : "pointer",
          }}
          onPointerDown={(e) => {
            if (disabled) return;
            (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
            setPressed(true);
          }}
          onPointerUp={(e) => {
            if (disabled) {
              setPressed(false);
              return;
            }
            const wasPressed = pressed;
            setPressed(false);
            if (wasPressed) onSpin?.();
            (e.currentTarget as SVGGElement).releasePointerCapture?.(
              e.pointerId,
            );
          }}
          onPointerCancel={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Girar la ruleta"
          aria-disabled={disabled || undefined}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setPressed(true);
            }
          }}
          onKeyUp={(e) => {
            if (disabled) return;
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setPressed(false);
              onSpin?.();
            }
          }}
        >
          <circle
            cx="0"
            cy="0"
            r={R_HUB}
            fill="url(#rw-grad-hub)"
            filter="url(#rw-bevel)"
          />
          <text
            x="0"
            y="-10"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#1a1a1a"
            className="font-display"
            style={{ fontSize: 26, fontWeight: 900, letterSpacing: "0.12em" }}
          >
            GIRAR
          </text>
          <text
            x="0"
            y="18"
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontSize: 18, letterSpacing: "0.3em" }}
          >
            <tspan fill="#1a1a1a">♠</tspan>{" "}
            <tspan fill="var(--color-chip-red-500)">♥</tspan>{" "}
            <tspan fill="#1a1a1a">♣</tspan>{" "}
            <tspan fill="var(--color-chip-red-500)">♦</tspan>
          </text>
        </g>

        {/* Bulbs (static). Reuses .animate-bulb — opacity portion of the
            keyframe works on SVG even though box-shadow doesn't. */}
        {Array.from({ length: BULB_COUNT }).map((_, i) => {
          const angle = (360 / BULB_COUNT) * i - 90;
          const { x, y } = polar(R_BULB, angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={5}
              fill="var(--color-gold-300)"
              filter="url(#rw-bulb-glow)"
              className="animate-bulb"
              style={{ animationDelay: `${(i % 5) * 180}ms` }}
            />
          );
        })}

        {/* Pointer (static, at 12 o'clock). Sits over the rim so it looks
            like it catches the wheel as it passes underneath. */}
        <g transform={`translate(0 ${-R_RIM_OUT + 6})`} filter="url(#rw-bevel)">
          <polygon
            points="-14,-16 14,-16 0,14"
            fill="url(#rw-grad-rim)"
            stroke="#8a6a10"
            strokeWidth="1.2"
          />
          <circle cx="0" cy="-11" r="3" fill="#5a4408" />
        </g>
      </svg>
    </div>
  );
}
