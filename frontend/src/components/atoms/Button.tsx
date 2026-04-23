import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "felt"
  | "gold"
  | "primary"
  | "info"
  | "danger"
  | "purple"
  | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  block?: boolean;
};

const BASE =
  "inline-flex items-center justify-center font-label tracking-wider select-none " +
  "rounded-full border transition-[transform,box-shadow,filter] duration-150 " +
  "active:scale-[0.97] disabled:brightness-[0.7] disabled:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]";

/**
 * Poker-chip variants — face shows the bg gradient; rim is a 3px colored
 * inset shadow with a thin white hairline between rim and face, like the
 * inner ring on a real casino chip. Bottom drop-shadow gives chip thickness.
 *
 *   bg-gradient      → chip face (lighter → darker)
 *   inset 3px rim    → outer rim in chip-300 color
 *   inset 1px white  → hairline separating rim from face
 *   0 5px 0 shadow   → "chip thickness" below
 *   soft drop shadow → chip resting on felt
 *
 * Semantics:
 *   primary → green  — confirm / go
 *   info    → blue   — secondary / informational
 *   danger  → red    — destructive
 *   purple  → violet — premium / high-denomination
 *   gold    → gold   — master / premium accent
 *   felt    → dark green — contextual table action
 *   ghost   → transparent — tertiary / cancel / nav
 */
const VARIANTS: Record<Variant, string> = {
  felt: "bg-gradient-to-b from-[var(--color-felt-600)] to-[var(--color-felt-700)] border-[--color-gold-500] text-[--color-cream] shadow-[inset_0_0_0_3px_var(--color-gold-500),inset_0_0_0_4px_rgba(255,255,255,0.25),0_5px_0_#062A1F,0_7px_16px_rgba(0,0,0,0.4)] hover:brightness-110",
  gold: "bg-gradient-to-b from-[var(--color-gold-300)] to-[var(--color-gold-500)] border-[--color-gold-500] text-[--color-smoke] shadow-[inset_0_0_0_3px_var(--color-gold-400),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_#8A6A10,0_7px_16px_rgba(0,0,0,0.4)] hover:brightness-110",
  primary:
    "bg-gradient-to-b from-[var(--color-chip-green-400)] to-[var(--color-chip-green-500)] border-[--color-chip-green-300] text-white shadow-[inset_0_0_0_3px_var(--color-chip-green-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_var(--color-chip-green-shadow),0_7px_16px_rgba(0,0,0,0.45)] hover:brightness-110",
  info: "bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)] border-[--color-chip-blue-300] text-white shadow-[inset_0_0_0_3px_var(--color-chip-blue-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_var(--color-chip-blue-shadow),0_7px_16px_rgba(0,0,0,0.45)] hover:brightness-110",
  danger:
    "bg-gradient-to-b from-[var(--color-chip-red-400)] to-[var(--color-chip-red-500)] border-[--color-chip-red-300] text-white shadow-[inset_0_0_0_3px_var(--color-chip-red-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_var(--color-chip-red-shadow),0_7px_16px_rgba(0,0,0,0.45)] hover:brightness-110",
  purple:
    "bg-gradient-to-b from-[var(--color-chip-purple-400)] to-[var(--color-chip-purple-500)] border-[--color-chip-purple-300] text-white shadow-[inset_0_0_0_3px_var(--color-chip-purple-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_var(--color-chip-purple-shadow),0_7px_16px_rgba(0,0,0,0.45)] hover:brightness-110",
  ghost:
    "bg-transparent border-[--color-cream]/40 text-[--color-cream]/90 hover:bg-white/5",
};

const SIZES: Record<Size, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-base px-6 py-3",
  lg: "text-lg px-8 py-4",
};

export function Button({
  variant = "felt",
  size = "md",
  block,
  className,
  children,
  ...rest
}: Props) {
  const cls = [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    block ? "w-full" : "",
    className ?? "",
  ].join(" ");
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
