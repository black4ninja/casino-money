import type { ReactNode } from "react";

type Tone = "felt" | "gold" | "danger" | "neutral";

const TONES: Record<Tone, string> = {
  felt: "bg-[--color-felt-700] text-[--color-cream] border-[--color-gold-500]/40",
  gold: "bg-[--color-gold-500] text-[--color-smoke] border-[--color-gold-500]",
  danger: "bg-[--color-carmine] text-[--color-cream] border-[--color-cream]/40",
  neutral: "bg-[--color-smoke-800] text-[--color-cream]/90 border-[--color-cream]/20",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-label text-[11px] tracking-widest",
        TONES[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
