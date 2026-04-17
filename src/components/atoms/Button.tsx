import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "felt" | "gold" | "danger" | "ghost";
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

const VARIANTS: Record<Variant, string> = {
  felt: "bg-[--color-felt-700] border-[--color-gold-500] text-[--color-cream] shadow-[0_6px_0_#062A1F,0_8px_18px_rgba(0,0,0,0.4)] hover:bg-[--color-felt-600]",
  gold: "bg-gradient-to-b from-[--color-gold-300] to-[--color-gold-500] border-[--color-gold-500] text-[--color-smoke] shadow-[0_6px_0_#8A6A10,0_8px_18px_rgba(0,0,0,0.4)] hover:brightness-110",
  danger:
    "bg-[--color-carmine] border-[--color-cream] text-[--color-cream] shadow-[0_6px_0_#6d0b0e,0_8px_18px_rgba(0,0,0,0.4)] hover:bg-[--color-carmine-400]",
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
