import { useNavigate } from "react-router-dom";
import { SidebarItem } from "../molecules/SidebarItem";
import { useAuthStore } from "@/stores/authStore";

type Props = {
  active: "users";
};

export function AdminSidebar({ active }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <aside
      aria-label="Navegación del maestro"
      className="flex flex-col gap-5 border-r border-[--color-gold-500]/20 bg-gradient-to-b from-[--color-felt-900] to-[--color-smoke] p-5 md:h-screen md:w-72 md:sticky md:top-0"
    >
      {/* Brand */}
      <div>
        <h1 className="gold-shine font-display text-2xl leading-tight">
          Casino Activity
        </h1>
        <p className="mt-1 font-label text-xs tracking-[0.3em] text-[--color-cream]/60">
          Panel del maestro
        </p>
      </div>

      {/* User info — plain text, no outline (not an action) */}
      {user && (
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
        <span className="font-label text-xs tracking-[0.25em] text-[--color-cream]/40 px-1">
          Cambiar de contexto
        </span>
        <SidebarItem
          to="/dealer"
          icon="♦"
          label="Modo tallador"
          hint="Operar mesa como dealer"
          variant="accent"
        />
      </div>

      {/* Admin nav section */}
      <div className="flex flex-col gap-2">
        <span className="font-label text-xs tracking-[0.25em] text-[--color-cream]/40 px-1">
          Administración
        </span>
        <nav className="flex flex-col gap-1">
          <SidebarItem
            to="/admin/users"
            icon="♣"
            label="Usuarios"
            active={active === "users"}
          />
        </nav>
      </div>

      {/* Logout pinned to bottom */}
      <div className="mt-auto pt-4 border-t border-[--color-gold-500]/15">
        <SidebarItem
          icon="⎋"
          label="Cerrar sesión"
          variant="danger"
          onClick={handleLogout}
        />
      </div>
    </aside>
  );
}
