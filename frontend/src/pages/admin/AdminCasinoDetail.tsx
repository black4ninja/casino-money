import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/templates/AdminLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { FormModal } from "@/components/molecules/FormModal";
import { MesaForm } from "@/components/organisms/MesaForm";
import { AssignTalladorForm } from "@/components/organisms/AssignTalladorForm";
import { AssignCasinoDepartamentosForm } from "@/components/organisms/AssignCasinoDepartamentosForm";
import { AssignCasinoDealersForm } from "@/components/organisms/AssignCasinoDealersForm";
import { useAuthStore } from "@/stores/authStore";
import {
  apiListDealerCandidates,
  apiListPlayerDepartamentos,
  type ApiError,
} from "@/lib/authApi";
import type { AuthUser } from "@/storage/auth";
import {
  apiGetCasino,
  apiListCasinoPlayers,
  apiUpdateCasino,
  type Casino,
} from "@/lib/casinoApi";
import {
  apiArchiveMesa,
  apiCreateMesa,
  apiDeleteMesa,
  apiListMesas,
  apiUnarchiveMesa,
  apiUpdateMesa,
  type Mesa,
} from "@/lib/mesaApi";
import { findGame, gameLabel } from "@/domain/games";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

type MesaDialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; mesa: Mesa }
  | { kind: "assignTallador"; mesa: Mesa }
  | { kind: "archive"; mesa: Mesa }
  | { kind: "unarchive"; mesa: Mesa }
  | { kind: "delete"; mesa: Mesa }
  | { kind: "assignDepartamentos" }
  | { kind: "assignDealers" };

export default function AdminCasinoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [casino, setCasino] = useState<Casino | null>(null);
  const [casinoLoading, setCasinoLoading] = useState(true);
  const [casinoError, setCasinoError] = useState<string | null>(null);

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasLoading, setMesasLoading] = useState(true);
  const [mesasError, setMesasError] = useState<string | null>(null);

  // Roster de candidatos a tallador (dealers + masters). Los admins también
  // operan mesas, así que aparecen aquí junto con los dealers. Fetched once
  // per page load; el form filtra por active antes de permitir seleccionar.
  const [dealers, setDealers] = useState<AuthUser[]>([]);
  const [dealersLoaded, setDealersLoaded] = useState(false);

  // Available departamentos for the casino-level multi-select, and the
  // materialized player roster (derived server-side from casino.departamentos).
  const [availableDepartamentos, setAvailableDepartamentos] = useState<string[]>(
    [],
  );
  const [casinoPlayers, setCasinoPlayers] = useState<AuthUser[]>([]);
  const [casinoPlayersLoading, setCasinoPlayersLoading] = useState(false);

  const [dialog, setDialog] = useState<MesaDialog>({ kind: "none" });
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

  const loadCasino = useCallback(async () => {
    if (!id) return;
    setCasinoLoading(true);
    setCasinoError(null);
    try {
      const { casino } = await withAuth((t) => apiGetCasino(t, id));
      setCasino(casino);
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 404) {
        setCasinoError("Este casino no existe o fue eliminado.");
      } else if (e.status === 401) {
        setCasinoError("Sesión expirada");
      } else {
        setCasinoError(e.message ?? "No se pudo cargar el casino.");
      }
    } finally {
      setCasinoLoading(false);
    }
  }, [id, withAuth]);

  const loadMesas = useCallback(async () => {
    if (!id) return;
    setMesasLoading(true);
    setMesasError(null);
    try {
      const { mesas } = await withAuth((t) => apiListMesas(t, id));
      setMesas(mesas);
    } catch (err) {
      const e = err as ApiError;
      setMesasError(e.message ?? "No se pudieron cargar las mesas.");
    } finally {
      setMesasLoading(false);
    }
  }, [id, withAuth]);

  const loadDealers = useCallback(async () => {
    try {
      const { users } = await withAuth((t) => apiListDealerCandidates(t));
      setDealers(users);
    } catch {
      // Non-fatal: the picker will show an empty/retry state if it opens.
    } finally {
      setDealersLoaded(true);
    }
  }, [withAuth]);

  const loadDepartamentos = useCallback(async () => {
    try {
      const { departamentos } = await withAuth((t) =>
        apiListPlayerDepartamentos(t),
      );
      setAvailableDepartamentos(departamentos);
    } catch {
      // Non-fatal: the picker will show an empty-state message.
    }
  }, [withAuth]);

  const loadCasinoPlayers = useCallback(async () => {
    if (!id) return;
    setCasinoPlayersLoading(true);
    try {
      const { players } = await withAuth((t) => apiListCasinoPlayers(t, id));
      setCasinoPlayers(players);
    } catch {
      setCasinoPlayers([]);
    } finally {
      setCasinoPlayersLoading(false);
    }
  }, [id, withAuth]);

  useEffect(() => {
    loadCasino();
    loadMesas();
    loadDealers();
    loadDepartamentos();
    loadCasinoPlayers();
  }, [loadCasino, loadMesas, loadDealers, loadDepartamentos, loadCasinoPlayers]);

  function closeDialog() {
    if (dialogLoading) return;
    setDialog({ kind: "none" });
    setDialogError(null);
  }

  async function handleCreateMesa(data: { gameType: string }) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiCreateMesa(t, id, data));
      setDialog({ kind: "none" });
      await loadMesas();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo crear la mesa");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleEditMesa(mesa: Mesa, data: { gameType: string }) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiUpdateMesa(t, id, mesa.id, data));
      setDialog({ kind: "none" });
      await loadMesas();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo guardar los cambios");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleAssignTallador(mesa: Mesa, talladorId: string | null) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiUpdateMesa(t, id, mesa.id, { talladorId }));
      setDialog({ kind: "none" });
      await loadMesas();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo asignar el dealer");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleArchiveMesa(mesa: Mesa) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiArchiveMesa(t, id, mesa.id));
      setDialog({ kind: "none" });
      await loadMesas();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo archivar la mesa");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleUnarchiveMesa(mesa: Mesa) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiUnarchiveMesa(t, id, mesa.id));
      setDialog({ kind: "none" });
      await loadMesas();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo reactivar la mesa");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleSaveDepartamentos(departamentos: string[]) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      const { casino: updated } = await withAuth((t) =>
        apiUpdateCasino(t, id, { departamentos }),
      );
      setCasino(updated);
      setDialog({ kind: "none" });
      await loadCasinoPlayers();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudieron guardar los departamentos");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleSaveDealers(dealerIds: string[]) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      const { casino: updated } = await withAuth((t) =>
        apiUpdateCasino(t, id, { dealerIds }),
      );
      setCasino(updated);
      setDialog({ kind: "none" });
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudieron guardar los dealers");
    } finally {
      setDialogLoading(false);
    }
  }

  async function handleDeleteMesa(mesa: Mesa) {
    if (!id) return;
    setDialogLoading(true);
    setDialogError(null);
    try {
      await withAuth((t) => apiDeleteMesa(t, id, mesa.id));
      setDialog({ kind: "none" });
      await loadMesas();
    } catch (err) {
      const e = err as ApiError;
      setDialogError(e.message ?? "No se pudo eliminar la mesa");
    } finally {
      setDialogLoading(false);
    }
  }

  const breadcrumbs = [
    { label: "Casinos", to: "/admin/casinos" },
    { label: casino?.name ?? (casinoLoading ? "Cargando…" : "Casino") },
  ];

  const title = casino?.name ?? (casinoLoading ? "Cargando…" : "Casino");
  const subtitle = casino
    ? `Fecha del evento · ${formatDate(casino.date)}`
    : undefined;

  const canAddMesas = Boolean(casino && casino.active);
  const dialogMesa = "mesa" in dialog ? dialog.mesa : null;

  return (
    <AdminLayout
      active="casinos"
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
    >
      <div className="flex flex-col gap-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/casinos")}
          >
            ← Volver a casinos
          </Button>
        </div>

        {casinoError && (
          <Card tone="night">
            <p
              className="font-label text-sm tracking-wider text-[--color-carmine-400]"
              role="alert"
            >
              {casinoError}
            </p>
            <div className="mt-4">
              <Link
                to="/admin/casinos"
                className="font-label text-xs tracking-widest text-[--color-gold-300] hover:text-[--color-gold-400]"
              >
                Regresar a la lista →
              </Link>
            </div>
          </Card>
        )}

        {!casinoLoading && !casinoError && casino && (
          <>
            {/* Casino summary header card */}
            <Card tone="night" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl text-[--color-ivory]">
                    {casino.name}
                  </h2>
                  {casino.active ? (
                    <Badge tone="success">activo</Badge>
                  ) : (
                    <Badge tone="danger">archivado</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() =>
                      window.open(
                        `/display/casino/${id}/carrera`,
                        "_blank",
                        "noopener,noreferrer",
                      )
                    }
                    title="Abre la proyección de la Carrera de Patrones en una nueva pestaña"
                  >
                    🏁 Proyectar carrera
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/admin/casinos/${id}/economy`)}
                  >
                    Ver economía
                  </Button>
                </div>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="font-label text-xs tracking-widest text-[--color-cream]/50">
                    Fecha del evento
                  </dt>
                  <dd className="mt-1 font-display text-lg text-[--color-ivory]">
                    {formatDate(casino.date)}
                  </dd>
                </div>
                <div>
                  <dt className="font-label text-xs tracking-widest text-[--color-cream]/50">
                    Alta
                  </dt>
                  <dd className="mt-1 font-display text-lg text-[--color-ivory]">
                    {formatDate(casino.createdAt)}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Departamentos section */}
            <Card tone="night" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-[--color-ivory]">
                    Departamentos
                  </h3>
                  <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                    {casino.departamentos.length === 0
                      ? "Sin departamentos asignados"
                      : `${casino.departamentos.length} departamento(s)`}
                  </p>
                </div>
                <Button
                  variant="info"
                  size="sm"
                  disabled={!casino.active}
                  title={
                    casino.active
                      ? undefined
                      : "Reactiva el casino para modificar asignaciones"
                  }
                  onClick={() => {
                    setDialogError(null);
                    setDialog({ kind: "assignDepartamentos" });
                  }}
                >
                  Cambiar departamentos
                </Button>
              </div>
              {casino.departamentos.length === 0 ? (
                <p className="font-label text-sm text-[--color-cream]/70">
                  Agrega uno o más departamentos para que sus jugadores
                  participen en este casino.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {casino.departamentos.map((d) => (
                    <Badge key={d} tone="felt">
                      {d}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Jugadores del casino (derivado) */}
            <Card tone="night" className="flex flex-col gap-3">
              <div>
                <h3 className="font-display text-xl text-[--color-ivory]">
                  Jugadores
                </h3>
                <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                  {casinoPlayersLoading
                    ? "Cargando…"
                    : `${casinoPlayers.length} jugador(es) derivados de los departamentos`}
                </p>
              </div>
              {!casinoPlayersLoading && casinoPlayers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(
                    casinoPlayers.reduce<Record<string, number>>((acc, p) => {
                      const key = p.departamento ?? "—";
                      acc[key] = (acc[key] ?? 0) + 1;
                      return acc;
                    }, {}),
                  )
                    .sort(([a], [b]) => a.localeCompare(b, "es"))
                    .map(([dept, count]) => (
                      <Badge key={dept} tone="neutral">
                        {dept} · {count}
                      </Badge>
                    ))}
                </div>
              )}
            </Card>

            {/* Talladores del casino */}
            <Card tone="night" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-[--color-ivory]">
                    Dealers
                  </h3>
                  <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                    {casino.dealerIds.length === 0
                      ? "Sin dealers asignados"
                      : `${casino.dealerIds.length} dealer(s)`}
                  </p>
                </div>
                <Button
                  variant="info"
                  size="sm"
                  disabled={!casino.active || !dealersLoaded}
                  title={
                    casino.active
                      ? undefined
                      : "Reactiva el casino para modificar asignaciones"
                  }
                  onClick={() => {
                    setDialogError(null);
                    setDialog({ kind: "assignDealers" });
                  }}
                >
                  Cambiar dealers
                </Button>
              </div>
              {casino.dealerIds.length === 0 ? (
                <p className="font-label text-sm text-[--color-cream]/70">
                  Sin dealers asignados al casino. Agrega algunos para poder
                  asignarlos a las mesas.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {casino.dealerIds.map((did) => {
                    const u = dealers.find((d) => d.id === did);
                    return (
                      <li
                        key={did}
                        className="flex items-center gap-3 rounded-lg bg-[--color-smoke]/60 px-3 py-2 ring-1 ring-inset ring-white/5"
                      >
                        {u ? (
                          <>
                            <span className="font-display text-[--color-ivory]">
                              {u.fullName ?? "(sin nombre)"}
                            </span>
                            <span className="font-mono text-xs text-[--color-gold-300]">
                              {u.matricula}
                            </span>
                          </>
                        ) : (
                          <span className="font-mono text-xs text-[--color-cream]/60">
                            (no está en la lista actual — puede estar archivado)
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            {/* Mesas section */}
            <Card tone="felt" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl text-[--color-ivory]">
                    Mesas
                  </h3>
                  <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
                    {mesas.length} en este casino
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!canAddMesas}
                  title={
                    canAddMesas
                      ? undefined
                      : "Reactiva el casino para agregar mesas"
                  }
                  onClick={() => {
                    setDialogError(null);
                    setDialog({ kind: "create" });
                  }}
                >
                  + Agregar mesa
                </Button>
              </div>

              {mesasError && (
                <p
                  className="font-label text-xs tracking-wider text-[--color-carmine-400]"
                  role="alert"
                >
                  {mesasError}
                </p>
              )}

              {mesasLoading ? (
                <p className="font-label text-sm text-[--color-cream]/60">
                  Cargando mesas…
                </p>
              ) : mesas.length === 0 ? (
                <p className="font-label text-sm text-[--color-cream]/70">
                  Aún no hay mesas en este casino. Agrega una con el botón de
                  arriba.
                </p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {mesas.map((m, i) => {
                    const tallador = m.talladorId
                      ? dealers.find((d) => d.id === m.talladorId) ?? null
                      : null;
                    return (
                      <MesaRow
                        key={m.id}
                        mesa={m}
                        index={i + 1}
                        tallador={tallador}
                        onEdit={() => {
                          setDialogError(null);
                          setDialog({ kind: "edit", mesa: m });
                        }}
                        onAssignTallador={() => {
                          setDialogError(null);
                          setDialog({ kind: "assignTallador", mesa: m });
                        }}
                        onArchive={() => {
                          setDialogError(null);
                          setDialog({ kind: "archive", mesa: m });
                        }}
                        onUnarchive={() => {
                          setDialogError(null);
                          setDialog({ kind: "unarchive", mesa: m });
                        }}
                        onDelete={() => {
                          setDialogError(null);
                          setDialog({ kind: "delete", mesa: m });
                        }}
                      />
                    );
                  })}
                </ol>
              )}
            </Card>
          </>
        )}
      </div>

      {/* Create / edit modal */}
      <FormModal
        open={dialog.kind === "create" || dialog.kind === "edit"}
        busy={dialogLoading}
        onClose={closeDialog}
      >
        {dialog.kind === "create" && (
          <MesaForm
            mode="create"
            onSubmit={handleCreateMesa}
            onCancel={closeDialog}
            loading={dialogLoading}
            error={dialogError}
          />
        )}
        {dialog.kind === "edit" && (
          <MesaForm
            mode="edit"
            initialGameType={dialog.mesa.gameType}
            onSubmit={(data) => handleEditMesa(dialog.mesa, data)}
            onCancel={closeDialog}
            loading={dialogLoading}
            error={dialogError}
          />
        )}
      </FormModal>

      <FormModal
        open={dialog.kind === "assignTallador"}
        busy={dialogLoading}
        onClose={closeDialog}
      >
        {dialog.kind === "assignTallador" && (
          <AssignTalladorForm
            dealers={dealers}
            currentTalladorId={dialog.mesa.talladorId}
            /* Los masters son siempre asignables como tallador: autoridad
               global de staff, no dependen del pool explícito que el admin
               cura para los dealers puros. Extendemos el allowlist con todos
               los masters activos para que aparezcan en el picker aun si el
               casino no los añadió explícitamente al pool. */
            allowedDealerIds={
              casino
                ? [
                    ...casino.dealerIds,
                    ...dealers
                      .filter((d) => d.role === "master" && d.active)
                      .map((d) => d.id),
                  ]
                : undefined
            }
            onSubmit={(talladorId) => handleAssignTallador(dialog.mesa, talladorId)}
            onCancel={closeDialog}
            loading={dialogLoading || !dealersLoaded}
            error={dialogError}
          />
        )}
      </FormModal>

      <FormModal
        open={dialog.kind === "assignDepartamentos"}
        busy={dialogLoading}
        onClose={closeDialog}
      >
        {dialog.kind === "assignDepartamentos" && casino && (
          <AssignCasinoDepartamentosForm
            availableDepartamentos={availableDepartamentos}
            currentDepartamentos={casino.departamentos}
            onSubmit={handleSaveDepartamentos}
            onCancel={closeDialog}
            loading={dialogLoading}
            error={dialogError}
          />
        )}
      </FormModal>

      <FormModal
        open={dialog.kind === "assignDealers"}
        busy={dialogLoading}
        onClose={closeDialog}
      >
        {dialog.kind === "assignDealers" && casino && (
          <AssignCasinoDealersForm
            availableDealers={dealers}
            currentDealerIds={casino.dealerIds}
            onSubmit={handleSaveDealers}
            onCancel={closeDialog}
            loading={dialogLoading || !dealersLoaded}
            error={dialogError}
          />
        )}
      </FormModal>

      <ConfirmDialog
        open={dialog.kind === "archive"}
        title="Archivar mesa"
        description={
          dialogMesa && (
            <p>
              La mesa de{" "}
              <span className="font-display text-[--color-ivory]">
                {gameLabel(dialogMesa.gameType)}
              </span>{" "}
              quedará archivada hasta que la reactives.
            </p>
          )
        }
        tone="purple"
        confirmLabel="Archivar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogMesa && handleArchiveMesa(dialogMesa)}
        onCancel={closeDialog}
      />

      <ConfirmDialog
        open={dialog.kind === "unarchive"}
        title="Reactivar mesa"
        description={
          dialogMesa && (
            <p>
              La mesa de{" "}
              <span className="font-display text-[--color-ivory]">
                {gameLabel(dialogMesa.gameType)}
              </span>{" "}
              volverá a estar disponible.
            </p>
          )
        }
        tone="primary"
        confirmLabel="Reactivar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogMesa && handleUnarchiveMesa(dialogMesa)}
        onCancel={closeDialog}
      />

      <ConfirmDialog
        open={dialog.kind === "delete"}
        title="Eliminar mesa"
        description={
          dialogMesa && (
            <p>
              Se eliminará la mesa de{" "}
              <span className="font-display text-[--color-ivory]">
                {gameLabel(dialogMesa.gameType)}
              </span>{" "}
              del casino. El registro queda oculto de la aplicación pero se
              conserva en la base de datos para auditoría.
            </p>
          )
        }
        tone="danger"
        confirmLabel="Eliminar"
        loading={dialogLoading}
        error={dialogError}
        onConfirm={() => dialogMesa && handleDeleteMesa(dialogMesa)}
        onCancel={closeDialog}
      />
    </AdminLayout>
  );
}

type MesaRowProps = {
  mesa: Mesa;
  index: number;
  /** Resolved tallador (if the id matches a known dealer). */
  tallador: AuthUser | null;
  onEdit: () => void;
  onAssignTallador: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
};

function MesaRow({
  mesa,
  index,
  tallador,
  onEdit,
  onAssignTallador,
  onArchive,
  onUnarchive,
  onDelete,
}: MesaRowProps) {
  const game = findGame(mesa.gameType);
  const label = game?.name ?? mesa.gameType;
  const emoji = game?.emoji ?? "◆";

  // Three states for the tallador slot:
  //   assigned, resolved (we have the full user object) → show name + matrícula
  //   assigned, unresolved (dealer not in current roster, e.g. archived) → show id placeholder
  //   unassigned → subtle "sin tallador" label so the slot reads as "to do"
  let talladorBlock: JSX.Element;
  if (mesa.talladorId && tallador) {
    talladorBlock = (
      <div className="flex items-baseline gap-2">
        <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/50">
          Dealer
        </span>
        <span className="font-display text-sm text-[--color-cream]">
          {tallador.fullName ?? "(sin nombre)"}
        </span>
        <span className="font-mono text-xs text-[--color-gold-300]">
          {tallador.matricula}
        </span>
      </div>
    );
  } else if (mesa.talladorId) {
    talladorBlock = (
      <div className="flex items-baseline gap-2">
        <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/50">
          Dealer
        </span>
        <span className="font-mono text-xs text-[--color-cream]/60">
          (no está en la lista actual)
        </span>
      </div>
    );
  } else {
    talladorBlock = (
      <div className="flex items-center gap-2">
        <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/40">
          Sin dealer asignado
        </span>
      </div>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5">
      <span aria-hidden className="text-2xl leading-none shrink-0">
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-label text-xs tracking-[0.3em] text-[--color-cream]/60">
            Mesa {index}
          </span>
          {!mesa.active && <Badge tone="danger">archivada</Badge>}
        </div>
        <div className="font-display text-lg text-[--color-ivory] truncate">
          {label}
        </div>
        <div className="mt-0.5">{talladorBlock}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="info" size="sm" onClick={onEdit}>
          Editar
        </Button>
        <Button variant="gold" size="sm" onClick={onAssignTallador}>
          {mesa.talladorId ? "Cambiar dealer" : "Asignar dealer"}
        </Button>
        {mesa.active ? (
          <Button variant="purple" size="sm" onClick={onArchive}>
            Archivar
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={onUnarchive}>
            Reactivar
          </Button>
        )}
        <Button variant="danger" size="sm" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </li>
  );
}
