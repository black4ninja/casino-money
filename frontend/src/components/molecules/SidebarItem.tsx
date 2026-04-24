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
  /**
   * When true, the item renders as an icon-only rail tile: label and hint
   * are visually hidden (but kept available to AT via sr-only + title),
   * and the icon is centered. The chip/ghost styling stays identical so
   * active/accent/danger read the same collapsed or expanded.
   */
  collapsed?: boolean;
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
 *   danger → red chip always-on (destructive: logout), matching the other
 *            chip-style CTAs in the app
 */
const BASE =
  "group relative flex items-center rounded-2xl w-full text-left " +
  "transition-[transform,box-shadow,filter,padding] duration-150 select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-felt-900]";

const CHIP_FELT =
  "bg-gradient-to-b from-[--color-felt-600] to-[--color-felt-700] text-[--color-ivory] " +
  "ring-1 ring-inset ring-white/15 " +
  "shadow-[0_4px_0_#062a1f,0_6px_16px_rgba(0,0,0,0.45)] " +
  "border border-[--color-felt-500]/30";

const CHIP_BLUE =
  "bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)] text-white " +
  "border border-[var(--color-chip-blue-300)] " +
  "shadow-[inset_0_0_0_3px_var(--color-chip-blue-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_var(--color-chip-blue-shadow),0_7px_16px_rgba(0,0,0,0.45)] " +
  "hover:brightness-110 active:translate-y-0.5 active:shadow-[inset_0_0_0_3px_var(--color-chip-blue-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_2px_0_var(--color-chip-blue-shadow),0_3px_8px_rgba(0,0,0,0.4)]";

const CHIP_RED =
  "bg-gradient-to-b from-[var(--color-chip-red-400)] to-[var(--color-chip-red-500)] text-white " +
  "border border-[var(--color-chip-red-300)] " +
  "shadow-[inset_0_0_0_3px_var(--color-chip-red-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_var(--color-chip-red-shadow),0_7px_16px_rgba(0,0,0,0.45)] " +
  "hover:brightness-110 active:translate-y-0.5 active:shadow-[inset_0_0_0_3px_var(--color-chip-red-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_2px_0_var(--color-chip-red-shadow),0_3px_8px_rgba(0,0,0,0.4)]";

const PLAIN_NAV =
  "text-[--color-cream]/80 hover:text-[--color-ivory] hover:bg-white/5 border border-transparent";

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
    inactive: CHIP_RED,
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
  collapsed,
  onClick,
}: Props) {
  const style = VARIANTS[variant];
  // Padding and gap adapt to mode: rail tile is a square-ish chip, expanded
  // is a wide row. Switching utility classes (not conditional nodes) keeps
  // the CSS width transition smooth.
  // `!` prefix forces the padding via !important — needed because React
  // Router's <Link> (rendered as <a>) was inheriting weird preflight rules
  // that ate the utility padding, while <button> (logout) rendered fine.
  const layout = collapsed
    ? "justify-center gap-0 !px-3 !py-3.5"
    : "gap-3 !pl-5 !pr-4 !py-3";
  const finalCls = [BASE, layout, active ? style.active : style.inactive].join(" ");

  // Native tooltip covers keyboard users as well as hover — delay is browser-
  // controlled and already "lazy" (~500ms) which is fine per UX research.
  const railTooltip = collapsed ? (hint ? `${label} — ${hint}` : label) : undefined;

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
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
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
      )}
    </>
  );

  if (onClick && !to) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={finalCls}
        title={railTooltip}
        aria-label={collapsed ? label : undefined}
      >
        {content}
      </button>
    );
  }
  return (
    <Link
      to={to ?? "#"}
      className={finalCls}
      title={railTooltip}
      aria-label={collapsed ? label : undefined}
    >
      {content}
    </Link>
  );
}
