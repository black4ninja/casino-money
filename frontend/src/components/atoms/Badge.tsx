import type { ReactNode } from "react";

type Tone =
  | "felt"
  | "gold"
  | "success"
  | "info"
  | "danger"
  | "neutral";

/**
 * Filled pill — the solid fill alone defines the shape. No border, since the
 * bg color provides enough contrast against any surface. This avoids the
 * "outline on outline on outline" stacking when badges sit inside bordered rows.
 *
 * Tone semantics:
 *   success → green chip, active/confirmed
 *   info    → blue chip, dealer role / informational
 *   danger  → red chip, inactive / error
 *   gold    → master role / premium accent
 *   felt    → player role / subtle table context (uses outline since bg is
 *             close to surrounding surfaces)
 *   neutral → smoke, placeholder state (uses outline for the same reason)
 */
const TONES: Record<Tone, string> = {
  felt: "bg-[--color-felt-700] text-[--color-cream] ring-1 ring-inset ring-[--color-gold-500]/40",
  gold: "bg-[--color-gold-500] text-[--color-smoke]",
  success: "bg-[--color-chip-green-500] text-white",
  info: "bg-[--color-chip-blue-500] text-white",
  danger: "bg-[--color-chip-red-500] text-white",
  neutral:
    "bg-[--color-smoke-800] text-[--color-cream]/90 ring-1 ring-inset ring-[--color-cream]/15",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label text-xs tracking-widest",
        TONES[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
