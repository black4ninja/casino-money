import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "felt" | "night" | "gold" | "glass";
};

/**
 * Surface hierarchy — following "nested surfaces" UX convention:
 *   level 0 (app bg): felt-900 + felt-weave texture
 *   level 1 (card `felt`):  felt-800 + glass film  → cristal verde
 *   level 1 (card `night`): smoke-800 + glass film → cristal neutro
 *   level 1 (card `gold`):  solid gold gradient — treated as an accent chip
 *   level 1 (card `glass`): translucent + strong backdrop blur — para hero
 *                           surfaces sobre fondos busy (landing).
 *
 * Glassmorphism: cada card tone ahora combina una base semi-opaca del color
 * del tono con un film blanco stacked (box-shadow inset). Esto le da al card
 * la "piel" de cristal esmerilado — highlight superior, glow interno, y borde
 * con un 1px white rim — sin perder el contraste para texto.
 */
const GLASS_SHADOW =
  "shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.28),inset_0_40px_80px_-40px_rgba(255,255,255,0.12)]";

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  felt: `bg-[--color-felt-800]/75 text-[--color-ivory] backdrop-blur-md ring-1 ring-inset ring-white/20 border border-white/10 ${GLASS_SHADOW}`,
  night: `bg-[--color-smoke-800]/75 text-[--color-ivory] backdrop-blur-md ring-1 ring-inset ring-white/20 border border-white/10 ${GLASS_SHADOW}`,
  gold: "bg-gradient-to-b from-[--color-gold-400] to-[--color-gold-500] text-[--color-smoke] ring-1 ring-inset ring-white/30 shadow-[0_10px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]",
  glass: `bg-white/[0.12] text-[--color-ivory] backdrop-blur-xl ring-1 ring-inset ring-white/25 border border-white/25 ${GLASS_SHADOW}`,
};

export function Card({ tone = "felt", className, children, ...rest }: Props) {
  return (
    <div
      className={[
        "rounded-3xl p-6 sm:p-7 mx-4",
        TONES[tone],
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
