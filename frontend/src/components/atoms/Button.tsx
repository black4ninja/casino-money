import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
  | "felt"
  | "gold"
  | "primary"
  | "info"
  | "danger"
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
  "active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]";

/**
 * Variant semantics (poker-chip palette):
 *   primary → green chip, confirm/create/go
 *   info    → blue chip, secondary/informational action
 *   danger  → red chip, destructive action
 *   gold    → premium / master emphasis
 *   felt    → contextual table action (neutral green)
 *   ghost   → tertiary / cancel / navigation
 */
/**
 * Every colored variant is styled to evoke a poker-chip on the felt:
 *   top-to-bottom gradient for depth + white inner ring + colored drop-shadow.
 */
const VARIANTS: Record<Variant, string> = {
  felt: "bg-gradient-to-b from-[--color-felt-600] to-[--color-felt-700] border-[--color-gold-500] text-[--color-cream] ring-1 ring-inset ring-white/10 shadow-[0_6px_0_#062A1F,0_8px_18px_rgba(0,0,0,0.4)] hover:brightness-110",
  gold: "bg-gradient-to-b from-[--color-gold-300] to-[--color-gold-500] border-[--color-gold-500] text-[--color-smoke] ring-1 ring-inset ring-white/30 shadow-[0_6px_0_#8A6A10,0_8px_18px_rgba(0,0,0,0.4)] hover:brightness-110",
  primary:
    "bg-gradient-to-b from-[--color-chip-green-400] to-[--color-chip-green-500] border-[--color-chip-green-300]/60 text-white ring-1 ring-inset ring-white/25 shadow-[0_6px_0_var(--color-chip-green-shadow),0_8px_18px_rgba(0,0,0,0.45)] hover:brightness-110",
  info: "bg-gradient-to-b from-[--color-chip-blue-400] to-[--color-chip-blue-500] border-[--color-chip-blue-300]/60 text-white ring-1 ring-inset ring-white/25 shadow-[0_6px_0_var(--color-chip-blue-shadow),0_8px_18px_rgba(0,0,0,0.45)] hover:brightness-110",
  danger:
    "bg-gradient-to-b from-[--color-chip-red-400] to-[--color-chip-red-500] border-[--color-chip-red-300]/60 text-white ring-1 ring-inset ring-white/25 shadow-[0_6px_0_var(--color-chip-red-shadow),0_8px_18px_rgba(0,0,0,0.45)] hover:brightness-110",
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
