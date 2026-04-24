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
      {/* Header unificado con el dealer: glass + sombra interna gold. En móvil
          se permite wrap (el slot right — típicamente Tabs — cae a una
          segunda fila ordenada en lugar de pelear con el título). */}
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-3 bg-[--color-felt-900]/60 px-4 py-4 backdrop-blur-sm shadow-[inset_0_-1px_0_rgba(212,175,55,0.35),0_2px_12px_-2px_rgba(212,175,55,0.2)] sm:flex-nowrap sm:px-6 sm:py-5 md:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-3">
          {back &&
            (back.label === undefined || back.label.length > 0 ? (
              <Link
                to={back.to}
                className="font-label shrink-0 rounded-full border border-[--color-gold-500]/40 px-3 py-1 text-xs text-[--color-cream]/80 hover:bg-white/5"
              >
                ← {back.label ?? "Volver"}
              </Link>
            ) : (
              <Link
                to={back.to}
                aria-label="Volver"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[--color-gold-500]/40 text-sm text-[--color-cream]/80 hover:bg-white/5"
              >
                ←
              </Link>
            ))}
          <div className="min-w-0">
            {title && (
              <h1 className="font-display text-2xl font-black gold-shine leading-tight sm:text-3xl md:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 font-label text-xs tracking-widest text-[--color-cream]/65 md:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right && (
          <div className="w-full shrink-0 sm:w-auto">{right}</div>
        )}
      </header>
      <main className="flex flex-col gap-6 px-4 sm:px-6 md:gap-8 md:px-8 lg:px-12">{children}</main>
    </div>
  );
}
