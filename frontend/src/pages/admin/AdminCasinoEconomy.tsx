import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/templates/AdminLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { FormModal } from "@/components/molecules/FormModal";
import { useAuthStore } from "@/stores/authStore";
import { apiGetCasino, type Casino } from "@/lib/casinoApi";
import {
  apiListCasinoEconomyWallets,
  type EconomyWalletRow,
} from "@/lib/economyApi";
import type { ApiError } from "@/lib/authApi";
import { BulkCreditPanel } from "@/components/organisms/BulkCreditPanel";
import { CasinoEconomyPlayersList } from "@/components/organisms/CasinoEconomyPlayersList";
import { DepositToPlayerForm } from "@/components/organisms/DepositToPlayerForm";
import { PlayerTransactionsView } from "@/components/organisms/PlayerTransactionsView";

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

type EconomyDialog =
  | { kind: "none" }
  | { kind: "deposit"; row: EconomyWalletRow }
  | { kind: "history"; row: EconomyWalletRow };

export default function AdminCasinoEconomy() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [casino, setCasino] = useState<Casino | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rows, setRows] = useState<EconomyWalletRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);

  const [dialog, setDialog] = useState<EconomyDialog>({ kind: "none" });

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
    setLoading(true);
    setError(null);
    try {
      const { casino } = await withAuth((t) => apiGetCasino(t, id));
      setCasino(casino);
    } catch (err) {
      const e = err as ApiError;
      if (e.status === 404) {
        setError("Este casino no existe o fue eliminado.");
      } else if (e.status === 401) {
        setError("Sesión expirada");
      } else {
        setError(e.message ?? "No se pudo cargar el casino.");
      }
    } finally {
      setLoading(false);
    }
  }, [id, withAuth]);

  const loadRows = useCallback(async () => {
    if (!id) return;
    setRowsLoading(true);
    try {
      const { rows } = await withAuth((t) =>
        apiListCasinoEconomyWallets(t, id),
      );
      setRows(rows);
    } catch {
      setRows([]);
    } finally {
      setRowsLoading(false);
    }
  }, [id, withAuth]);

  useEffect(() => {
    loadCasino();
    loadRows();
  }, [loadCasino, loadRows]);

  // Helpers para actualizar una fila puntualmente tras un depósito, así la
  // UI refleja el nuevo saldo sin esperar el re-fetch completo.
  const patchRowBalance = useCallback(
    (playerId: string, newBalance: number) => {
      setRows((prev) =>
        prev.map((r) =>
          r.player.id === playerId ? { ...r, balance: newBalance } : r,
        ),
      );
    },
    [],
  );

  const breadcrumbs = [
    { label: "Casinos", to: "/admin/casinos" },
    {
      label: casino?.name ?? (loading ? "Cargando…" : "Casino"),
      to: id ? `/admin/casinos/${id}` : undefined,
    },
    { label: "Economía" },
  ];

  const title = casino ? `Economía · ${casino.name}` : loading ? "Cargando…" : "Economía";
  const subtitle = casino
    ? `Fecha del evento · ${formatDate(casino.date)}`
    : undefined;

  const canMutate = Boolean(casino?.active);
  const dialogRow = "row" in dialog ? dialog.row : null;

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
            onClick={() => id && navigate(`/admin/casinos/${id}`)}
          >
            ← Volver al casino
          </Button>
        </div>

        {error && (
          <Card tone="night">
            <p
              className="font-label text-sm tracking-wider text-[--color-carmine-400]"
              role="alert"
            >
              {error}
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

        {!loading && !error && casino && id && (
          <>
            <Card tone="night" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl text-[--color-ivory]">
                  Estado económico actual
                </h2>
                {casino.active ? (
                  <Badge tone="success">activo</Badge>
                ) : (
                  <Badge tone="danger">archivado</Badge>
                )}
              </div>
              <p className="font-label text-sm text-[--color-cream]/70">
                Vista general de la economía del casino. Entrega fichas a
                todos los jugadores de una sola vez, revisa saldos y
                deposita o consulta historial por jugador.
              </p>
            </Card>

            <BulkCreditPanel
              casinoId={casino.id}
              canCredit={canMutate}
              playerCount={rows.length}
              playersLoading={rowsLoading}
              onCredited={loadRows}
            />

            <CasinoEconomyPlayersList
              rows={rows}
              loading={rowsLoading}
              canDeposit={canMutate}
              onDeposit={(row) => setDialog({ kind: "deposit", row })}
              onViewHistory={(row) => setDialog({ kind: "history", row })}
            />
          </>
        )}
      </div>

      <FormModal
        open={dialog.kind === "deposit"}
        onClose={() => setDialog({ kind: "none" })}
      >
        {dialog.kind === "deposit" && id && (
          <DepositToPlayerForm
            casinoId={id}
            player={dialog.row.player}
            currentBalance={dialog.row.balance}
            onClose={() => setDialog({ kind: "none" })}
            onDeposited={(newBalance) => {
              patchRowBalance(dialog.row.player.id, newBalance);
            }}
          />
        )}
      </FormModal>

      <FormModal
        open={dialog.kind === "history"}
        onClose={() => setDialog({ kind: "none" })}
      >
        {dialog.kind === "history" && id && dialogRow && (
          <PlayerTransactionsView
            casinoId={id}
            player={dialogRow.player}
            onClose={() => setDialog({ kind: "none" })}
          />
        )}
      </FormModal>
    </AdminLayout>
  );
}
