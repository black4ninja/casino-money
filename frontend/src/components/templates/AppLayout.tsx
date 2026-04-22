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
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 pb-10 pt-6 md:gap-8 md:pb-14 md:pt-10">
      <header className="flex items-center justify-between gap-3 px-4">
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
              <h1 className="font-display text-3xl font-black gold-shine leading-none md:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 font-label text-xs text-[--color-cream]/70 md:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right}
      </header>
      <main className="flex flex-col gap-6 px-4 sm:px-6 md:gap-8 md:px-8 lg:px-12">{children}</main>
    </div>
  );
}
