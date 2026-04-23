import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

/**
 * Filled-style input (Material Design filled pattern) — no default border.
 * Depth comes from a solid darker bg against whatever surface hosts it.
 * Focus state raises a gold ring (interactive affordance). Error raises a red ring.
 *
 * This avoids nested outlines when the input sits inside a Card or Panel,
 * which are now border-less by convention.
 *
 * forwardRef-enabled so callers can programmatically focus (e.g. LoginForm
 * focuses the password field when the backend confirms password is required).
 */
export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={inputId}>
      {label && (
        <span className="font-label text-xs text-[--color-cream]/70">
          {label}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        className={[
          "rounded-xl bg-[--color-smoke]/80 px-4 py-3 text-[--color-ivory]",
          "placeholder-[--color-cream]/30",
          "border-0 ring-1 ring-inset",
          error
            ? "ring-[--color-chip-red-400]/80"
            : "ring-white/5",
          "focus:outline-none focus:ring-2 focus:ring-[--color-gold-400]",
          "transition-[box-shadow] duration-150",
          className ?? "",
        ].join(" ")}
        {...rest}
      />
      {hint && !error && (
        <span className="text-xs text-[--color-cream]/50">{hint}</span>
      )}
      {error && (
        <span className="text-xs text-[--color-chip-red-300]">{error}</span>
      )}
    </label>
  );
});
