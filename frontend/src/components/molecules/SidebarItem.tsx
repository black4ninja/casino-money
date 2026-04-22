import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Variant = "nav" | "accent" | "danger";

type Props = {
  to?: string;
  icon?: ReactNode;
  label: string;
  hint?: string;
  active?: boolean;
  variant?: Variant;
  onClick?: () => void;
};

/**
 * Every actionable sidebar item evokes a poker-chip sitting on the felt:
 *   • Solid saturated fill (full opacity — no washout against the felt bg)
 *   • Top-to-bottom gradient for subtle 3D depth
 *   • Inner white ring echoing a chip's printed edge stripe
 *   • Deep colored drop-shadow so the chip feels placed on the table
 *
 * Variants:
 *   nav    → active = felt-green chip (matches the table); inactive = plain text
 *   accent → blue chip (context switch: "Modo tallador")
 *   danger → red chip (destructive: logout) — only shows chip style on hover
 */
const BASE =
  "group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 w-full text-left " +
  "transition-[transform,box-shadow,filter] duration-150 select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]";

const CHIP_FELT =
  "bg-gradient-to-b from-[--color-felt-600] to-[--color-felt-700] text-[--color-ivory] " +
  "ring-1 ring-inset ring-white/15 " +
  "shadow-[0_4px_0_#062a1f,0_6px_16px_rgba(0,0,0,0.45)] " +
  "border border-[--color-felt-500]/30";

const CHIP_BLUE =
  "bg-gradient-to-b from-[--color-chip-blue-400] to-[--color-chip-blue-500] text-white " +
  "ring-1 ring-inset ring-white/25 " +
  "shadow-[0_4px_0_var(--color-chip-blue-shadow),0_6px_16px_rgba(0,0,0,0.45)] " +
  "border border-[--color-chip-blue-300]/50 " +
  "hover:brightness-110 active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-chip-blue-shadow),0_3px_8px_rgba(0,0,0,0.4)]";

const CHIP_RED =
  "bg-gradient-to-b from-[--color-chip-red-400] to-[--color-chip-red-500] text-white " +
  "ring-1 ring-inset ring-white/25 " +
  "shadow-[0_4px_0_var(--color-chip-red-shadow),0_6px_16px_rgba(0,0,0,0.45)] " +
  "border border-[--color-chip-red-300]/50 " +
  "active:translate-y-0.5 active:shadow-[0_2px_0_var(--color-chip-red-shadow),0_3px_8px_rgba(0,0,0,0.4)]";

const PLAIN_NAV =
  "text-[--color-cream]/80 hover:text-[--color-ivory] hover:bg-white/5 border border-transparent";

const PLAIN_GHOST =
  "text-[--color-cream]/70 hover:text-white border border-transparent";

const VARIANTS: Record<Variant, { inactive: string; active: string }> = {
  nav: {
    inactive: PLAIN_NAV,
    active: CHIP_FELT,
  },
  accent: {
    inactive: CHIP_BLUE,
    active: CHIP_BLUE,
  },
  danger: {
    inactive: `${PLAIN_GHOST} hover:[&]:bg-transparent`,
    active: CHIP_RED,
  },
};

export function SidebarItem({
  to,
  icon,
  label,
  hint,
  active,
  variant = "nav",
  onClick,
}: Props) {
  const style = VARIANTS[variant];
  const cls = [BASE, active ? style.active : style.inactive].join(" ");

  // Danger variant turns into a red chip on hover (only when inactive).
  const dangerHover =
    variant === "danger" && !active
      ? "hover:bg-gradient-to-b hover:from-[--color-chip-red-400] hover:to-[--color-chip-red-500] " +
        "hover:text-white hover:ring-1 hover:ring-inset hover:ring-white/25 " +
        "hover:shadow-[0_4px_0_var(--color-chip-red-shadow),0_6px_16px_rgba(0,0,0,0.45)] " +
        "hover:border-[--color-chip-red-300]/50"
      : "";

  const finalCls = [cls, dangerHover].join(" ");

  const content = (
    <>
      {icon && (
        <span
          aria-hidden
          className="text-2xl leading-none shrink-0 drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]"
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-label text-base tracking-wider truncate">
          {label}
        </span>
        {hint && (
          <span className="text-xs tracking-wide font-normal opacity-80 truncate">
            {hint}
          </span>
        )}
      </span>
    </>
  );

  if (onClick && !to) {
    return (
      <button type="button" onClick={onClick} className={finalCls}>
        {content}
      </button>
    );
  }
  return (
    <Link to={to ?? "#"} className={finalCls}>
      {content}
    </Link>
  );
}
