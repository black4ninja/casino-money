import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, id, ...rest }: Props) {
  const inputId = id ?? rest.name;
  return (
    <label className="flex flex-col gap-1.5 text-sm" htmlFor={inputId}>
      {label && (
        <span className="font-label text-xs text-[--color-cream]/70">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={[
          "rounded-xl border bg-[--color-smoke-800]/60 px-4 py-3 text-[--color-ivory]",
          "border-[--color-gold-500]/40 placeholder-[--color-cream]/30",
          "focus:border-[--color-gold-400] focus:outline-none",
          error ? "border-[--color-carmine]" : "",
          className ?? "",
        ].join(" ")}
        {...rest}
      />
      {hint && !error && (
        <span className="text-xs text-[--color-cream]/50">{hint}</span>
      )}
      {error && <span className="text-xs text-[--color-carmine-400]">{error}</span>}
    </label>
  );
}
