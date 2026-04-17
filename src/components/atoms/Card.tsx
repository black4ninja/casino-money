import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "felt" | "night" | "gold";
};

const TONES: Record<NonNullable<Props["tone"]>, string> = {
  felt: "bg-[--color-felt-800]/90 border-[--color-gold-500]/40",
  night: "bg-[--color-smoke-800]/90 border-[--color-gold-500]/30",
  gold: "bg-gradient-to-b from-[--color-gold-400] to-[--color-gold-500] border-[--color-smoke]/60 text-[--color-smoke]",
};

export function Card({ tone = "felt", className, children, ...rest }: Props) {
  return (
    <div
      className={[
        "rounded-3xl border backdrop-blur-sm shadow-[0_8px_28px_rgba(0,0,0,0.4)] p-5",
        TONES[tone],
        className ?? "",
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
