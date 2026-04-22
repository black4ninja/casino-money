import { useState, type ReactNode } from "react";
import { AdminSidebar } from "../organisms/AdminSidebar";

type Props = {
  children: ReactNode;
  active: "users";
  title: string;
  subtitle?: string;
};

export function AdminLayout({ children, active, title, subtitle }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Mobile topbar */}
      <div className="flex items-center justify-between border-b border-[--color-gold-500]/20 bg-[--color-felt-900] px-4 py-3 md:hidden">
        <div>
          <h1 className="gold-shine font-display text-xl leading-none">{title}</h1>
          {subtitle && (
            <p className="font-label text-xs tracking-widest text-[--color-cream]/60 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setMobileOpen(true)}
          className="rounded-full border border-[--color-gold-500]/50 px-3 py-1 font-label text-xs text-[--color-cream]"
        >
          ☰
        </button>
      </div>

      {/* Desktop sidebar: persistent column */}
      <div className="hidden md:block">
        <AdminSidebar active={active} />
      </div>

      {/* Mobile sidebar: overlay drawer */}
      {mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="absolute inset-y-0 left-0 w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar active={active} />
          </div>
        </div>
      )}

      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
        <header className="mb-6 hidden md:block">
          <h1 className="gold-shine font-display text-3xl md:text-4xl leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 font-label text-xs tracking-widest text-[--color-cream]/60">
              {subtitle}
            </p>
          )}
        </header>
        {children}
      </main>
    </div>
  );
}
