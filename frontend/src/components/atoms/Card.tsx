import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "felt" | "night" | "gold" | "glass";
};

/**
 * Surface hierarchy — following "nested surfaces" UX convention:
 *   level 0 (app bg): felt-900 + felt-weave texture
 *   level 1 (card `felt`):  felt-800  → +10% lightness vs app
 *   level 1 (card `night`): smoke-800 → neutral contrast card
 *   level 1 (card `gold`):  solid gold gradient — treated as an accent chip
 *   level 1 (card `glass`): translucent + backdrop blur — for hero surfaces
 *                           that sit over a busy/textured background (landing).
 *
 * Cards do NOT carry a border by default; depth is conveyed with shadow + bg
 * contrast. This avoids nested-outline clutter when the card hosts inputs,
 * tables, or other already-bordered atoms.
 */
const TONES: Record<NonNullable<Props["tone"]>, string> = {
  felt: "bg-[--color-felt-800]/95 text-[--color-ivory]",
  night: "bg-[--color-smoke-800]/90 text-[--color-ivory]",
  gold: "bg-gradient-to-b from-[--color-gold-400] to-[--color-gold-500] text-[--color-smoke] ring-1 ring-inset ring-white/30",
  glass:
    "bg-white/[0.06] text-[--color-ivory] backdrop-blur-md ring-1 ring-inset ring-white/15 border border-white/20",
};

export function Card({ tone = "felt", className, children, ...rest }: Props) {
  return (
    <div
      className={[
        "rounded-3xl p-5 shadow-[0_8px_28px_rgba(0,0,0,0.4)] mx-4",
        TONES[tone],
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
