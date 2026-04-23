export type TabItem<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type Props<T extends string> = {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Color accent for the active tab. Matches the role color system
   * (gold=master, info=dealer, felt=player) so tabs echo the row Badges.
   */
  accent?: (value: T) => "gold" | "info" | "felt";
};

/**
 * Active-tab chip treatment — mirrors the Button atom's poker-chip look
 * (colored rim inset + white hairline + bottom thickness + drop shadow)
 * so tabs feel like the same physical object as the action buttons.
 */
const ACCENT_CLASSES: Record<"gold" | "info" | "felt", string> = {
  gold:
    "bg-gradient-to-b from-[var(--color-gold-300)] to-[var(--color-gold-500)] border border-[var(--color-gold-500)] text-[--color-smoke] shadow-[inset_0_0_0_3px_var(--color-gold-400),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_#8A6A10,0_7px_16px_rgba(0,0,0,0.4)]",
  info:
    "bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)] border border-[var(--color-chip-blue-300)] text-white shadow-[inset_0_0_0_3px_var(--color-chip-blue-300),inset_0_0_0_4px_rgba(255,255,255,0.4),0_5px_0_var(--color-chip-blue-shadow),0_7px_16px_rgba(0,0,0,0.45)]",
  felt:
    "bg-gradient-to-b from-[var(--color-felt-600)] to-[var(--color-felt-700)] border border-[var(--color-gold-500)] text-[--color-cream] shadow-[inset_0_0_0_3px_var(--color-gold-500),inset_0_0_0_4px_rgba(255,255,255,0.25),0_5px_0_#062A1F,0_7px_16px_rgba(0,0,0,0.4)]",
};

/**
 * Segmented-control tabs. Sits on a dark felt surface as a filled row;
 * the active tab uses the chip-palette gradient for its role. No outlines
 * stacked — consistent with the nested-surfaces convention.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  accent,
}: Props<T>) {
  return (
    <div
      role="tablist"
      className="inline-flex flex-wrap gap-1 rounded-full bg-[--color-smoke]/60 p-1 ring-1 ring-inset ring-white/5"
    >
      {items.map((item) => {
        const active = item.value === value;
        const tone = accent ? accent(item.value) : "felt";
        const activeCls = ACCENT_CLASSES[tone];
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={[
              "font-label tracking-wider text-sm px-4 py-2 rounded-full transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]",
              active
                ? activeCls
                : "text-[--color-cream]/70 hover:text-[--color-cream] hover:bg-white/5",
            ].join(" ")}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={[
                  "ml-2 inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 text-[0.65rem]",
                  active
                    ? "bg-black/20"
                    : "bg-white/10 text-[--color-cream]/80",
                ].join(" ")}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
