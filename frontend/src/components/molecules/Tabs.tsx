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

const ACCENT_CLASSES: Record<"gold" | "info" | "felt", string> = {
  gold:
    "bg-gradient-to-b from-[--color-gold-300] to-[--color-gold-500] text-[--color-smoke] shadow-[0_4px_0_#8A6A10,0_6px_12px_rgba(0,0,0,0.35)]",
  info:
    "bg-gradient-to-b from-[--color-chip-blue-400] to-[--color-chip-blue-500] text-white shadow-[0_4px_0_var(--color-chip-blue-shadow),0_6px_12px_rgba(0,0,0,0.35)]",
  felt:
    "bg-gradient-to-b from-[--color-felt-600] to-[--color-felt-700] text-[--color-cream] shadow-[0_4px_0_#062A1F,0_6px_12px_rgba(0,0,0,0.35)]",
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
