type Props = {
  amount: number;
  label?: string;
  size?: "md" | "lg" | "xl";
};

const SIZES: Record<NonNullable<Props["size"]>, string> = {
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
};

export function Balance({ amount, label, size = "lg" }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="font-label text-xs text-[--color-cream]/70">
          {label}
        </span>
      )}
      <span
        className={`gold-shine font-display font-black ${SIZES[size]}`}
        aria-live="polite"
      >
        ${amount.toLocaleString("es-MX")}
      </span>
    </div>
  );
}
