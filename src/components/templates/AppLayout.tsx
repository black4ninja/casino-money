import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  back?: { to: string; label?: string };
  right?: ReactNode;
};

export function AppLayout({ children, title, subtitle, back, right }: Props) {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col gap-6 px-4 pb-10 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {back && (
            <Link
              to={back.to}
              className="font-label rounded-full border border-[--color-gold-500]/40 px-3 py-1 text-xs text-[--color-cream]/80 hover:bg-white/5"
            >
              ← {back.label ?? "Volver"}
            </Link>
          )}
          <div>
            {title && (
              <h1 className="font-display text-3xl font-black gold-shine leading-none">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 font-label text-xs text-[--color-cream]/70">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right}
      </header>
      <main className="flex flex-col gap-5">{children}</main>
    </div>
  );
}
