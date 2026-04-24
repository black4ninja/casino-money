import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarItem } from "../molecules/SidebarItem";
import { ConfirmDialog } from "../molecules/ConfirmDialog";
import { useAuthStore } from "@/stores/authStore";

type Props = {
  active: "users" | "casinos";
  /**
   * Desktop collapsed (icon-only rail) state. When true, the brand, user
   * info block, and section labels collapse; only the SidebarItems remain,
   * each rendering in its rail-tile mode.
   */
  collapsed?: boolean;
  /** Optional — when provided, the desktop rail shows a toggle chevron. */
  onToggle?: () => void;
};

export function AdminSidebar({ active, collapsed, onToggle }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleConfirmLogout() {
    setLoggingOut(true);
    setLogoutError(null);
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      setLogoutError(
        err instanceof Error ? err.message : "No se pudo cerrar la sesión",
      );
      setLoggingOut(false);
    }
    // Success path: component unmounts on navigate so no state reset needed.
  }

  // The width transition is what animates between rail and full. Padding
  // drops with it so icon tiles can breathe in rail mode without huge gaps.
  const widthCls = collapsed
    ? "md:w-20 p-2 gap-4"
    : "md:w-72 p-5 gap-5";

  return (
    <aside
      aria-label="Navegación del maestro"
      // Right divider reads as a casino-sign gold rail: a 1px solid gold
      // hairline (via inset box-shadow so it doesn't fight the flex border
      // of the aside) + a soft gold glow that echoes the marquee aesthetic
      // already used in NeonBulb / animate-marquee-glow.
      className={[
        "flex flex-col",
        "shadow-[inset_-1px_0_0_var(--color-gold-500),2px_0_12px_-2px_rgba(212,175,55,0.25)]",
        "bg-gradient-to-b from-[--color-felt-900] to-[--color-smoke]",
        "md:h-screen md:sticky md:top-0",
        "transition-[width,padding] duration-300 ease-out",
        widthCls,
      ].join(" ")}
    >
      {/* Brand + toggle row. Toggle stays visible in both modes so users
          can always re-expand from the rail. */}
      <div
        className={[
          "flex items-center",
          collapsed ? "justify-center" : "justify-between gap-2",
        ].join(" ")}
      >
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="gold-shine font-display text-2xl leading-tight truncate">
              Pattern Casino
            </h1>
            <p className="mt-1 font-label text-xs tracking-[0.3em] text-[--color-cream]/60">
              Panel del maestro
            </p>
          </div>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expandir (⌘/Ctrl + B)" : "Colapsar (⌘/Ctrl + B)"}
            className="shrink-0 rounded-full border border-[--color-gold-500]/40 bg-[--color-smoke]/70 px-2.5 py-1 font-label text-lg leading-none text-[--color-gold-300] transition hover:border-[--color-gold-400] hover:text-[--color-gold-400] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]"
          >
            ☰
          </button>
        )}
      </div>

      {/* User info block — plain text, disappears in rail mode since the
          matrícula doesn't read well squeezed into 80px. */}
      {user && !collapsed && (
        <div className="flex flex-col gap-0.5">
          {user.fullName && (
            <span className="font-display text-lg text-[--color-ivory] leading-tight">
              {user.fullName}
            </span>
          )}
          <span className="font-mono text-xs text-[--color-gold-300]">
            {user.matricula}
          </span>
          <span className="font-label text-xs tracking-widest text-[--color-cream]/50 mt-0.5">
            Rol · {user.role}
          </span>
        </div>
      )}

      {/* Role switch — separated, visually distinct (blue chip) */}
      <div className="flex flex-col gap-2">
        {!collapsed && (
          <span className="font-label text-xs tracking-[0.25em] text-[--color-cream]/40 px-1">
            Cambiar de contexto
          </span>
        )}
        <SidebarItem
          to="/dealer"
          icon="♦"
          label="Modo dealer"
          hint="Operar mesa como dealer"
          variant="accent"
          collapsed={collapsed}
        />
      </div>

      {/* Admin nav section */}
      <div className="flex flex-col gap-2">
        {!collapsed && (
          <span className="font-label text-xs tracking-[0.25em] text-[--color-cream]/40 px-1">
            Administración
          </span>
        )}
        <nav className="flex flex-col gap-1">
          <SidebarItem
            to="/admin/users"
            icon="♣"
            label="Usuarios"
            active={active === "users"}
            collapsed={collapsed}
          />
          <SidebarItem
            to="/admin/casinos"
            icon="★"
            label="Casinos"
            active={active === "casinos"}
            collapsed={collapsed}
          />
        </nav>
      </div>

      {/* Logout — pinned to bottom on desktop (mt-auto fills the tall
          sidebar), forced ~2rem breathing room on mobile where the sidebar
          is content-height and mt-auto has nothing to do. */}
      <div
        className={[
          "mt-14 md:mt-auto",
          collapsed ? "" : "",
        ].join(" ")}
      >
        <SidebarItem
          icon="⎋"
          label="Cerrar sesión"
          variant="danger"
          collapsed={collapsed}
          onClick={() => {
            setLogoutError(null);
            setConfirmLogout(true);
          }}
        />
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Cerrar sesión"
        description={
          <p>
            Tu sesión actual se cerrará y tendrás que volver a iniciar con tu
            matrícula
            {user?.matricula ? (
              <>
                {" "}
                <span className="font-mono text-[--color-gold-300]">
                  ({user.matricula})
                </span>
              </>
            ) : null}
            .
          </p>
        }
        tone="danger"
        confirmLabel="Cerrar sesión"
        loading={loggingOut}
        error={logoutError}
        onConfirm={handleConfirmLogout}
        onCancel={() => {
          if (loggingOut) return;
          setConfirmLogout(false);
          setLogoutError(null);
        }}
      />
    </aside>
  );
}
