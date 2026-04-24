import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AdminSidebar } from "../organisms/AdminSidebar";
import { Breadcrumbs, type BreadcrumbItem } from "../molecules/Breadcrumbs";

type Props = {
  children: ReactNode;
  active: "users" | "casinos";
  title: string;
  subtitle?: string;
  /**
   * Optional breadcrumb trail rendered above the title. First crumb is
   * normally a back link to the section list; the last one is the current
   * page and stays as plain text.
   */
  breadcrumbs?: BreadcrumbItem[];
};

const COLLAPSED_STORAGE_KEY = "casino:admin:sidebar_collapsed";

/** Read once, synchronously, before first paint so the sidebar lands in the
 * correct width without a flash. SSR-safe guard for `window`. */
function readInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AdminLayout({
  children,
  active,
  title,
  subtitle,
  breadcrumbs,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(
    readInitialCollapsed,
  );

  const toggleDesktop = useCallback(() => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Storage unavailable (private mode, quota) — state still works in-memory.
      }
      return next;
    });
  }, []);

  // Cmd/Ctrl + B — VSCode / Linear / Shadcn convention. Skip when focus is
  // inside an editable element so Ctrl+B keeps meaning "bold" in inputs.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "b" && e.key !== "B") return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target as HTMLElement | null;
      if (target?.matches("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
      toggleDesktop();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleDesktop]);

  return (
    <div className="landing-bg-fixed flex min-h-screen flex-col md:flex-row">
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
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="rounded-full border border-[--color-gold-500]/50 px-3 py-1 font-label text-xs text-[--color-cream]"
        >
          ☰
        </button>
      </div>

      {/* Desktop sidebar — rail or full, persistent column */}
      <div className="hidden md:block">
        <AdminSidebar
          active={active}
          collapsed={desktopCollapsed}
          onToggle={toggleDesktop}
        />
      </div>

      {/* Mobile sidebar: overlay drawer — always expanded in this mode. */}
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
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} className="mb-3" />
          )}
          <h1 className="gold-shine font-display text-3xl md:text-4xl leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 font-label text-xs tracking-widest text-[--color-cream]/60">
              {subtitle}
            </p>
          )}
        </header>
        {/* Mobile-only breadcrumbs — topbar is too tight, render them here. */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} className="mb-4 md:hidden" />
        )}
        {children}
      </main>
    </div>
  );
}
