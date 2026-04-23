import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/templates/AdminLayout";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/organisms/DataTable";
import { CreateCasinoForm } from "@/components/organisms/CreateCasinoForm";
import { EditCasinoForm } from "@/components/organisms/EditCasinoForm";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormModal } from "@/components/molecules/FormModal";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import {
  apiArchiveCasino,
  apiCreateCasino,
  apiDeleteCasino,
  apiListCasinos,
  apiUnarchiveCasino,
  apiUpdateCasino,
  type Casino,
} from "@/lib/casinoApi";

type Dialog =
  | { kind: "none" }
  | { kind: "edit"; casino: Casino }
  | { kind: "archive"; casino: Casino }
  | { kind: "unarchive"; casino: Casino }
  | { kind: "delete"; casino: Casino };

/** Render an ISO date as Mexican-locale day label ("15 may 2026"). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function AdminCasinos() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

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

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { casinos } = await withAuth((t) => apiListCasinos(t));
      setCasinos(casinos);
    } catch (err) {
      const e = err as ApiError;
      setLoadError(
        e.status === 401 ? "Sesión expirada" : e.message ?? "No se pudo cargar la lista",
      );
    } finally {
      setLoading(false);
    }
  }, [withAuth]);

  useEffect(() => {
    load();
  }, [load]);

  function closeDialog() {
    if (dialogLoading) return;
    setDialog({ kind: "none" });
    setDialogError(null);
  }

  async function handleCreate(data: { name: string; date: string }) {
    setCreateLoading(true);
    setCreateError(null);
    try {
      await withAuth((t) => apiCreateCasino(t, data));
      setShowForm(false);
      await load();
    } catch (err) {
      const e = err as ApiError;
      setCreateError(e.message ?? "No se pudo crear el casino");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit(
    casino: Casino,
    data: { name: string; date: string },
  ) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiUpdateCasino(t, casino.id, data));
      setDialog({ kind: "none" });
      await load();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo guardar los cambios");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleArchive(casino: Casino) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiArchiveCasino(t, casino.id));
      setDialog({ kind: "none" });
      await load();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo archivar");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleUnarchive(casino: Casino) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiUnarchiveCasino(t, casino.id));
      setDialog({ kind: "none" });
      await load();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo reactivar");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleDelete(casino: Casino) {
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiDeleteCasino(t, casino.id));
      setDialog({ kind: "none" });
      await load();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo eliminar");
    } finally {
      setDialogLoading(false);
    }
  }

  const columns: DataTableColumn<Casino>[] = [
    {
      key: "name",
      header: "Nombre",
      minWidth: "200px",
      cell: (c) => (
        <span className="font-display text-base text-[--color-ivory]">
          {c.name}
        </span>
      ),
    },
    {
      key: "date",
      header: "Fecha",
      cell: (c) => (
        <span className="font-label text-sm text-[--color-cream]">
          {formatDate(c.date)}
        </span>
      ),
    },
    {
      key: "active",
      header: "Estado",
      cell: (c) =>
        c.active ? (
          <Badge tone="success">activo</Badge>
        ) : (
          <Badge tone="danger">archivado</Badge>
        ),
    },
    {
      key: "createdAt",
      header: "Alta",
      cell: (c) => formatDate(c.createdAt),
    },
    {
      key: "id",
      header: "Acciones",
      sortable: false,
      minWidth: "340px",
      cell: (c) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="gold"
            size="sm"
            onClick={() => navigate(`/admin/casinos/${c.id}`)}
          >
            Ver
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={() => {
              setDialogError(null);
              setDialog({ kind: "edit", casino: c });
            }}
          >
            Editar
          </Button>
          {c.active ? (
            <Button
              variant="purple"
              size="sm"
              onClick={() => {
                setDialogError(null);
                setDialog({ kind: "archive", casino: c });
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
                setDialog({ kind: "unarchive", casino: c });
              }}
            >
              Reactivar
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setDialogError(null);
              setDialog({ kind: "delete", casino: c });
            }}
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  const dialogCasino = dialog.kind !== "none" ? dialog.casino : null;

  return (
    <AdminLayout active="casinos" title="Casinos" subtitle="Eventos programados">
      <div className="flex flex-col gap-6">
        {loadError && (
          <p
            className="font-label text-xs tracking-wider text-[--color-carmine-400]"
            role="alert"
          >
            {loadError}
          </p>
        )}

        <DataTable<Casino>
          data={casinos}
          columns={columns}
          searchKeys={["name"]}
          searchPlaceholder="Buscar por nombre"
          loading={loading}
          emptyMessage="Aún no hay casinos programados."
          getRowId={(c) => c.id}
          pageSize={10}
          toolbar={
            <Button variant="primary" onClick={() => setShowForm(true)}>
              + Nuevo casino
            </Button>
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
        <CreateCasinoForm
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
        open={dialog.kind === "edit"}
        busy={dialogLoading}
        onClose={closeDialog}
      >
        {dialog.kind === "edit" && dialogCasino && (
          <EditCasinoForm
            casino={dialogCasino}
            onSubmit={(data) => handleEdit(dialogCasino, data)}
            onCancel={closeDialog}
            loading={dialogLoading}
            error={dialogError}
          />
        )}
      </FormModal>

      <ConfirmDialog
        open={dialog.kind === "archive"}
        title="Archivar casino"
        description={
          dialogCasino && (
            <>
              <p>
                <span className="font-display text-[--color-ivory]">
                  {dialogCasino.name}
                </span>{" "}
                dejará de considerarse un evento operable hasta que sea
                reactivado.
              </p>
              <p className="mt-2 text-[--color-cream]/60">
                Las mesas y asignaciones que se le vinculen después no podrán
                ejecutarse mientras esté archivado.
              </p>
            </>
          )
        }
        tone="purple"
        confirmLabel="Archivar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogCasino && handleArchive(dialogCasino)}
        onCancel={closeDialog}
      />

      <ConfirmDialog
        open={dialog.kind === "unarchive"}
        title="Reactivar casino"
        description={
          dialogCasino && (
            <p>
              <span className="font-display text-[--color-ivory]">
                {dialogCasino.name}
              </span>{" "}
              volverá a considerarse un evento operable.
            </p>
          )
        }
        tone="primary"
        confirmLabel="Reactivar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogCasino && handleUnarchive(dialogCasino)}
        onCancel={closeDialog}
      />

      <ConfirmDialog
        open={dialog.kind === "delete"}
        title="Eliminar casino"
        description={
          dialogCasino && (
            <>
              <p>
                Se eliminará el casino{" "}
                <span className="font-display text-[--color-ivory]">
                  {dialogCasino.name}
                </span>{" "}
                del sistema. No podrá ser visto en listados.
              </p>
              <p className="mt-2 text-[--color-cream]/60">
                El registro se conserva en la base de datos para auditoría.
              </p>
            </>
          )
        }
        tone="danger"
        confirmLabel="Eliminar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogCasino && handleDelete(dialogCasino)}
        onCancel={closeDialog}
      />
    </AdminLayout>
  );
}
