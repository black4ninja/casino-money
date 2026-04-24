import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/templates/AdminLayout";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/organisms/DataTable";
import { CreateUserForm } from "@/components/organisms/CreateUserForm";
import { EditUserForm } from "@/components/organisms/EditUserForm";
import { ImportPlayersModal } from "@/components/organisms/ImportPlayersModal";
import { Tabs, type TabItem } from "@/components/molecules/Tabs";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormModal } from "@/components/molecules/FormModal";
import { useAuthStore } from "@/stores/authStore";
import {
  apiArchiveUser,
  apiBulkImportPlayers,
  apiCreateUser,
  apiDeleteUser,
  apiListUsers,
  apiUnarchiveUser,
  apiUpdateUser,
  type ApiError,
  type BulkImportPlayerRow,
  type UserCollection,
} from "@/lib/authApi";
import { downloadPlayerCsvTemplate } from "@/lib/playerCsv";
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
    title: "Dealers",
    roleLabel: "dealer",
    subtitle: "Dealers registrados",
    emptyMessage: "Aún no hay dealers registrados.",
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

/** Dialog currently open in the actions flow. */
type Dialog =
  | { kind: "none" }
  | { kind: "edit"; user: AuthUser }
  | { kind: "archive"; user: AuthUser }
  | { kind: "unarchive"; user: AuthUser }
  | { kind: "delete"; user: AuthUser };

export default function AdminUsers() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);
  const currentUser = useAuthStore((s) => s.user);

  const [activeCollection, setActiveCollection] =
    useState<UserCollection>("masters");
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [showImport, setShowImport] = useState(false);

  const activeTab =
    TABS.find((t) => t.collection === activeCollection) ?? TABS[0];
  const isPlayersTab = activeCollection === "players";

  /** Wraps an authenticated API call with one-shot refresh-on-401 retry. */
  const withAuth = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      if (!accessToken) throw { status: 401, message: "no token" } as ApiError;
      try {
        return await fn(accessToken);
      } catch (err) {
        const e = err as ApiError;
        if (e.status !== 401) throw err;
        const fresh = await refresh();
        return fn(fresh);
      }
    },
    [accessToken, refresh],
  );

  const load = useCallback(
    async (collection: UserCollection) => {
      setLoading(true);
      setLoadError(null);
      try {
        const { users } = await withAuth((t) => apiListUsers(t, collection));
        setUsers(users);
      } catch (err) {
        const e = err as ApiError;
        setLoadError(
          e.status === 401 ? "Sesión expirada" : e.message ?? "No se pudo cargar la lista",
        );
      } finally {
        setLoading(false);
      }
    },
    [withAuth],
  );

  useEffect(() => {
    load(activeCollection);
  }, [load, activeCollection]);

  function handleChangeTab(collection: UserCollection) {
    setActiveCollection(collection);
    setShowForm(false);
    setShowImport(false);
    setCreateError(null);
    setLoadError(null);
    setDialog({ kind: "none" });
    setUsers([]);
  }

  async function handleCreate(data: {
    matricula: string;
    password: string;
    fullName: string;
    departamento: string;
  }) {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await withAuth((t) =>
        apiCreateUser(t, activeCollection, {
          matricula: data.matricula,
          password: isPlayersTab ? undefined : data.password,
          fullName: data.fullName || undefined,
          departamento: isPlayersTab ? data.departamento || undefined : undefined,
        }),
      );
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

  async function handleBulkImport(rows: BulkImportPlayerRow[]) {
    return withAuth((t) => apiBulkImportPlayers(t, rows));
  }

  async function closeImport() {
    setShowImport(false);
    // Refresh — imports may have created rows we need to reflect.
    await load(activeCollection);
  }

  function closeDialog() {
    if (dialogLoading) return;
    setDialog({ kind: "none" });
    setDialogError(null);
  }

  async function handleEdit(
    user: AuthUser,
    data: {
      fullName: string | null;
      departamento?: string | null;
      password?: string;
    },
  ) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) =>
        apiUpdateUser(t, activeCollection, user.id, {
          fullName: data.fullName,
          departamento: data.departamento,
          password: data.password,
        }),
      );
      setDialog({ kind: "none" });
      await load(activeCollection);
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo guardar los cambios");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleArchive(user: AuthUser) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiArchiveUser(t, activeCollection, user.id));
      setDialog({ kind: "none" });
      await load(activeCollection);
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo archivar");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleUnarchive(user: AuthUser) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiUnarchiveUser(t, activeCollection, user.id));
      setDialog({ kind: "none" });
      await load(activeCollection);
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo reactivar");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleDelete(user: AuthUser) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiDeleteUser(t, activeCollection, user.id));
      setDialog({ kind: "none" });
      await load(activeCollection);
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo eliminar");
    } finally {
      setDialogLoading(false);
    }
  }

  const columns: DataTableColumn<AuthUser>[] = [
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
    ...(isPlayersTab
      ? ([
          {
            key: "departamento",
            header: "Departamento",
            cell: (u: AuthUser) =>
              u.departamento ? (
                <span className="text-[--color-cream]">{u.departamento}</span>
              ) : (
                <span className="text-[--color-cream]/40">—</span>
              ),
          },
        ] as DataTableColumn<AuthUser>[])
      : []),
    // The "Rol" column is redundant on the players tab — the tab itself
    // already tells the user which role they're looking at.
    ...(!isPlayersTab
      ? ([
          {
            key: "role",
            header: "Rol",
            cell: (u: AuthUser) => {
              const tone =
                u.role === "master"
                  ? "gold"
                  : u.role === "dealer"
                    ? "info"
                    : "felt";
              return <Badge tone={tone}>{u.role}</Badge>;
            },
          },
        ] as DataTableColumn<AuthUser>[])
      : []),
    {
      key: "active",
      header: "Estado",
      cell: (u) =>
        u.active ? (
          <Badge tone="success">activo</Badge>
        ) : (
          <Badge tone="danger">archivado</Badge>
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
    {
      key: "id",
      header: "Acciones",
      sortable: false,
      minWidth: "260px",
      cell: (u) => {
        const isSelf = currentUser?.id === u.id;
        return (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="info"
              size="sm"
              onClick={() => {
                setDialogError(null);
                setDialog({ kind: "edit", user: u });
              }}
            >
              Editar
            </Button>
            {u.active ? (
              <Button
                variant="purple"
                size="sm"
                disabled={isSelf}
                title={isSelf ? "No puedes archivarte a ti mismo" : undefined}
                onClick={() => {
                  setDialogError(null);
                  setDialog({ kind: "archive", user: u });
                }}
              >
                Archivar
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDialogError(null);
                  setDialog({ kind: "unarchive", user: u });
                }}
              >
                Reactivar
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              disabled={isSelf}
              title={isSelf ? "No puedes eliminarte a ti mismo" : undefined}
              onClick={() => {
                setDialogError(null);
                setDialog({ kind: "delete", user: u });
              }}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];

  const tabItems: TabItem<UserCollection>[] = TABS.map((t) => ({
    value: t.collection,
    label: t.title,
    count: t.collection === activeCollection ? users.length : undefined,
  }));

  const dialogUser = dialog.kind !== "none" ? dialog.user : null;

  return (
    <AdminLayout active="users" title="Usuarios" subtitle={activeTab.subtitle}>
      <div className="flex flex-col gap-6">
        <Tabs<UserCollection>
          items={tabItems}
          value={activeCollection}
          onChange={handleChangeTab}
          accent={(v) =>
            TABS.find((t) => t.collection === v)?.accent ?? "felt"
          }
        />

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
          columns={columns}
          searchKeys={
            isPlayersTab
              ? ["matricula", "fullName", "departamento"]
              : ["matricula", "fullName"]
          }
          searchPlaceholder={
            isPlayersTab
              ? "Buscar por matrícula, nombre o departamento"
              : "Buscar por matrícula o nombre"
          }
          loading={loading}
          emptyMessage={activeTab.emptyMessage}
          getRowId={(u) => u.id}
          pageSize={10}
          toolbar={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="primary" onClick={() => setShowForm(true)}>
                + Nuevo {activeTab.roleLabel}
              </Button>
              {isPlayersTab && (
                <>
                  <Button
                    variant="info"
                    onClick={() => setShowImport(true)}
                  >
                    Importar CSV
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => downloadPlayerCsvTemplate()}
                  >
                    Descargar plantilla
                  </Button>
                </>
              )}
            </div>
          }
        />
      </div>

      <FormModal
        open={showForm}
        busy={createLoading}
        onClose={() => {
          setShowForm(false);
          setCreateError(null);
        }}
      >
        <CreateUserForm
          roleLabel={activeTab.roleLabel}
          isPlayer={isPlayersTab}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowForm(false);
            setCreateError(null);
          }}
          loading={createLoading}
          error={createError}
        />
      </FormModal>

      <FormModal
        open={showImport}
        onClose={() => {
          void closeImport();
        }}
      >
        <ImportPlayersModal
          onCancel={() => {
            void closeImport();
          }}
          onImport={handleBulkImport}
        />
      </FormModal>

      <FormModal
        open={dialog.kind === "edit"}
        busy={dialogLoading}
        onClose={closeDialog}
      >
        {dialog.kind === "edit" && dialogUser && (
          <EditUserForm
            user={dialogUser}
            roleLabel={activeTab.roleLabel}
            onSubmit={(data) => handleEdit(dialogUser, data)}
            onCancel={closeDialog}
            loading={dialogLoading}
            error={dialogError}
          />
        )}
      </FormModal>

      <ConfirmDialog
        open={dialog.kind === "archive"}
        title={`Archivar ${activeTab.roleLabel}`}
        description={
          dialogUser && (
            <>
              <p>
                <span className="font-display text-[--color-ivory]">
                  {dialogUser.fullName ?? dialogUser.matricula}
                </span>{" "}
                no podrá iniciar sesión ni ejecutar ninguna acción en el sistema
                hasta que sea reactivado.
              </p>
              <p className="mt-2 text-[--color-cream]/60">
                Sus sesiones activas se cerrarán inmediatamente.
              </p>
            </>
          )
        }
        tone="purple"
        confirmLabel="Archivar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogUser && handleArchive(dialogUser)}
        onCancel={closeDialog}
      />

      <ConfirmDialog
        open={dialog.kind === "unarchive"}
        title={`Reactivar ${activeTab.roleLabel}`}
        description={
          dialogUser && (
            <p>
              <span className="font-display text-[--color-ivory]">
                {dialogUser.fullName ?? dialogUser.matricula}
              </span>{" "}
              podrá iniciar sesión y volver a operar normalmente.
            </p>
          )
        }
        tone="primary"
        confirmLabel="Reactivar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogUser && handleUnarchive(dialogUser)}
        onCancel={closeDialog}
      />

      <ConfirmDialog
        open={dialog.kind === "delete"}
        title={`Eliminar ${activeTab.roleLabel}`}
        description={
          dialogUser && (
            <>
              <p>
                Se eliminará a{" "}
                <span className="font-display text-[--color-ivory]">
                  {dialogUser.fullName ?? dialogUser.matricula}
                </span>{" "}
                del sistema. No podrá iniciar sesión ni ser visto en listados.
              </p>
              <p className="mt-2 text-[--color-cream]/60">
                El registro se conserva en la base de datos para auditoría, pero
                queda oculto para la aplicación.
              </p>
            </>
          )
        }
        tone="danger"
        confirmLabel="Eliminar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogUser && handleDelete(dialogUser)}
        onCancel={closeDialog}
      />
    </AdminLayout>
  );
}
