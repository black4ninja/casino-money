import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/templates/AdminLayout";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/organisms/DataTable";
import { CreateUserForm } from "@/components/organisms/CreateUserForm";
import { Tabs, type TabItem } from "@/components/molecules/Tabs";
import { useAuthStore } from "@/stores/authStore";
import {
  apiCreateUser,
  apiListUsers,
  type ApiError,
  type UserCollection,
} from "@/lib/authApi";
import type { AuthUser } from "@/storage/auth";

type RoleTabConfig = {
  collection: UserCollection;
  title: string;
  roleLabel: string;
  subtitle: string;
  emptyMessage: string;
  accent: "gold" | "info" | "felt";
};

const TABS: readonly RoleTabConfig[] = [
  {
    collection: "masters",
    title: "Administradores",
    roleLabel: "maestro",
    subtitle: "Maestros registrados",
    emptyMessage: "Aún no hay maestros registrados.",
    accent: "gold",
  },
  {
    collection: "dealers",
    title: "Talladores",
    roleLabel: "tallador",
    subtitle: "Talladores registrados",
    emptyMessage: "Aún no hay talladores registrados.",
    accent: "info",
  },
  {
    collection: "players",
    title: "Jugadores",
    roleLabel: "jugador",
    subtitle: "Jugadores registrados",
    emptyMessage: "Aún no hay jugadores registrados.",
    accent: "felt",
  },
] as const;

const COLUMNS: DataTableColumn<AuthUser>[] = [
  {
    key: "matricula",
    header: "Matrícula",
    minWidth: "120px",
    cell: (u) => (
      <span className="font-mono text-xs text-[--color-cream]">
        {u.matricula}
      </span>
    ),
  },
  {
    key: "fullName",
    header: "Nombre",
    cell: (u) => (
      <span className="font-display text-base text-[--color-ivory]">
        {u.fullName ?? "—"}
      </span>
    ),
  },
  {
    key: "role",
    header: "Rol",
    cell: (u) => {
      const tone =
        u.role === "master" ? "gold" : u.role === "dealer" ? "info" : "felt";
      return <Badge tone={tone}>{u.role}</Badge>;
    },
  },
  {
    key: "active",
    header: "Estado",
    cell: (u) =>
      u.active ? (
        <Badge tone="success">activo</Badge>
      ) : (
        <Badge tone="danger">inactivo</Badge>
      ),
  },
  {
    key: "createdAt",
    header: "Alta",
    cell: (u) =>
      new Date(u.createdAt).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
];

export default function AdminUsers() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [activeCollection, setActiveCollection] =
    useState<UserCollection>("masters");
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const activeTab =
    TABS.find((t) => t.collection === activeCollection) ?? TABS[0];

  const load = useCallback(
    async (collection: UserCollection) => {
      if (!accessToken) return;
      setLoading(true);
      setLoadError(null);
      try {
        const { users } = await apiListUsers(accessToken, collection);
        setUsers(users);
      } catch (err) {
        const e = err as ApiError;
        if (e.status === 401) {
          try {
            const newAccess = await refresh();
            const { users } = await apiListUsers(newAccess, collection);
            setUsers(users);
            return;
          } catch {
            setLoadError("Sesión expirada");
            return;
          }
        }
        setLoadError(e.message ?? "No se pudo cargar la lista");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, refresh],
  );

  useEffect(() => {
    load(activeCollection);
  }, [load, activeCollection]);

  function handleChangeTab(collection: UserCollection) {
    setActiveCollection(collection);
    setShowForm(false);
    setCreateError(null);
    setLoadError(null);
    setUsers([]);
  }

  async function handleCreate(data: {
    matricula: string;
    password: string;
    fullName: string;
  }) {
    if (!accessToken) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      await apiCreateUser(accessToken, activeCollection, {
        matricula: data.matricula,
        password: data.password,
        fullName: data.fullName || undefined,
      });
      setShowForm(false);
      await load(activeCollection);
    } catch (err) {
      const e = err as ApiError;
      if (e.code === "MATRICULA_TAKEN") {
        setCreateError("Esa matrícula ya está registrada");
      } else {
        setCreateError(e.message ?? `No se pudo crear el ${activeTab.roleLabel}`);
      }
    } finally {
      setCreateLoading(false);
    }
  }

  const tabItems: TabItem<UserCollection>[] = TABS.map((t) => ({
    value: t.collection,
    label: t.title,
    count: t.collection === activeCollection ? users.length : undefined,
  }));

  return (
    <AdminLayout
      active="users"
      title="Usuarios"
      subtitle={activeTab.subtitle}
    >
      <div className="flex flex-col gap-6">
        <Tabs<UserCollection>
          items={tabItems}
          value={activeCollection}
          onChange={handleChangeTab}
          accent={(v) =>
            TABS.find((t) => t.collection === v)?.accent ?? "felt"
          }
        />

        {showForm && (
          <CreateUserForm
            roleLabel={activeTab.roleLabel}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowForm(false);
              setCreateError(null);
            }}
            loading={createLoading}
            error={createError}
          />
        )}

        {loadError && (
          <p
            className="font-label text-xs tracking-wider text-[--color-carmine-400]"
            role="alert"
          >
            {loadError}
          </p>
        )}

        <DataTable<AuthUser>
          data={users}
          columns={COLUMNS}
          searchKeys={["matricula", "fullName"]}
          searchPlaceholder="Buscar por matrícula o nombre"
          loading={loading}
          emptyMessage={activeTab.emptyMessage}
          getRowId={(u) => u.id}
          pageSize={10}
          toolbar={
            !showForm ? (
              <Button variant="primary" onClick={() => setShowForm(true)}>
                + Nuevo {activeTab.roleLabel}
              </Button>
            ) : null
          }
        />
      </div>
    </AdminLayout>
  );
}
