import { Button } from "@/components/atoms/Button";

export const AMOUNT_PRESETS = [500, 1000, 1500, 2000, 2500] as const;
export const AMOUNT_DENOMINATION = 100;
export const AMOUNT_MIN = 100;
export const AMOUNT_MAX = 100_000;
export const AMOUNT_DEFAULT = 1500;

export function formatMxn(n: number): string {
  return `$${n.toLocaleString("es-MX")}`;
}

export function clampAmount(n: number): number {
  const clamped = Math.max(AMOUNT_MIN, Math.min(AMOUNT_MAX, n));
  return Math.round(clamped / AMOUNT_DENOMINATION) * AMOUNT_DENOMINATION;
}

type Props = {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
};

/**
 * Selector de monto con presets rápidos ($500, $1K, …) y stepper ±$100.
 * Compartido entre el bulk-credit a todos y el modal de depósito individual
 * para mantener la misma UX de "pocos clics, sin escribir números".
 *
 * `value` se mantiene snapped al múltiplo de 100 y clamped a [100, 100_000].
 */
export function AmountPicker({ value, onChange, disabled }: Props) {
  const billetes = Math.floor(value / AMOUNT_DENOMINATION);

  function apply(next: number) {
    const snapped = clampAmount(next);
    if (snapped !== value) onChange(snapped);
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/50 mb-2">
          Montos rápidos
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {AMOUNT_PRESETS.map((val) => (
            <Button
              key={val}
              variant={val === value ? "primary" : "felt"}
              size="sm"
              onClick={() => apply(val)}
              disabled={disabled}
              className="touch-manipulation"
              style={{ minHeight: "52px" }}
            >
              {formatMxn(val)}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/50 mb-2">
          Ajuste fino
        </p>
        <div className="flex items-stretch gap-2">
          <Button
            variant="felt"
            size="sm"
            onClick={() => apply(value - AMOUNT_DENOMINATION)}
            disabled={disabled || value <= AMOUNT_MIN}
            className="touch-manipulation"
            style={{ minWidth: "64px", minHeight: "56px" }}
            aria-label="Restar $100"
          >
            −$100
          </Button>
          <div className="flex flex-1 flex-col items-center justify-center rounded-full bg-[--color-smoke]/60 px-4 py-2 ring-1 ring-inset ring-white/5">
            <span className="gold-shine font-display text-3xl leading-none">
              {formatMxn(value)}
            </span>
            <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/60 mt-1">
              {billetes} billete{billetes === 1 ? "" : "s"} de $100
            </span>
          </div>
          <Button
            variant="felt"
            size="sm"
            onClick={() => apply(value + AMOUNT_DENOMINATION)}
            disabled={disabled || value >= AMOUNT_MAX}
            className="touch-manipulation"
            style={{ minWidth: "64px", minHeight: "56px" }}
            aria-label="Sumar $100"
          >
            +$100
          </Button>
        </div>
      </div>
    </div>
  );
}
