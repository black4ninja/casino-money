import { useCallback, useEffect, useState } from "react";
import { FormModal } from "@/components/molecules/FormModal";
import { CasinoEconomyPlayersList } from "@/components/organisms/CasinoEconomyPlayersList";
import { DepositToPlayerForm } from "@/components/organisms/DepositToPlayerForm";
import { DebitFromPlayerForm } from "@/components/organisms/DebitFromPlayerForm";
import { Card } from "@/components/atoms/Card";
import { useAuthStore } from "@/stores/authStore";
import {
  apiListCasinoEconomyWallets,
  type EconomyWalletRow,
} from "@/lib/economyApi";
import type { ApiError } from "@/lib/authApi";

type PayDialog =
  | { kind: "none" }
  | { kind: "deposit"; row: EconomyWalletRow }
  | { kind: "debit"; row: EconomyWalletRow };

type Props = {
  /** Casino al que pertenece la mesa. Fuente de verdad para el roster y los wallets. */
  casinoId: string;
  /**
   * Flag de permisos locales: si el casino o la mesa están archivados, los
   * movimientos (depositar o cobrar) deberían estar desactivados pero la
   * lista igual es visible. Misma guardia para ambas direcciones.
   */
  canDeposit: boolean;
};

/**
 * Tab "Pagar" del dealer. Reutiliza los mismos componentes del panel admin:
 *   - `CasinoEconomyPlayersList` para mostrar el roster + saldo + buscador
 *   - `DepositToPlayerForm` para la mecánica del depósito
 *   - `DebitFromPlayerForm` para la mecánica del cobro
 *
 * El endpoint `/casinos/:casinoId/economy/*` acepta al dealer (con mesa
 * activa en ese casino) desde que se cambió el gating a
 * `requireCasinoEconomyAccess`; no necesitamos API paralela.
 */
export function DealerPayView({ casinoId, canDeposit }: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [rows, setRows] = useState<EconomyWalletRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(true);
  const [rowsError, setRowsError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<PayDialog>({ kind: "none" });

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

  const loadRows = useCallback(async () => {
    setRowsLoading(true);
    setRowsError(null);
    try {
      const { rows } = await withAuth((t) =>
        apiListCasinoEconomyWallets(t, casinoId),
      );
      // En el tab del dealer solo mostramos jugadores — los dealers aparecen
      // también en la vista del admin pero acá son ruido (nadie paga ni cobra
      // a un dealer, su saldo crece solo por comisiones automáticas).
      setRows(rows.filter((r) => r.user.role === "player"));
    } catch (err) {
      const e = err as ApiError;
      setRowsError(e.message ?? "No se pudo cargar el roster");
      setRows([]);
    } finally {
      setRowsLoading(false);
    }
  }, [casinoId, withAuth]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // Actualiza una fila puntualmente tras un movimiento, así la UI refleja
  // el nuevo saldo sin esperar el re-fetch completo. Sirve para depósito
  // y cobro — ambos terminan en un número nuevo.
  const patchRowBalance = useCallback(
    (playerId: string, newBalance: number) => {
      setRows((prev) =>
        prev.map((r) =>
          r.user.id === playerId ? { ...r, balance: newBalance } : r,
        ),
      );
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {rowsError && (
        <Card tone="night">
          <p
            className="font-label text-sm tracking-wider text-[--color-chip-red-300]"
            role="alert"
          >
            {rowsError}
          </p>
        </Card>
      )}

      <CasinoEconomyPlayersList
        rows={rows}
        loading={rowsLoading}
        canDeposit={canDeposit}
        onDeposit={(row) => setDialog({ kind: "deposit", row })}
        onDebit={(row) => setDialog({ kind: "debit", row })}
      />

      <FormModal
        open={dialog.kind === "deposit"}
        onClose={() => setDialog({ kind: "none" })}
      >
        {dialog.kind === "deposit" && (
          <DepositToPlayerForm
            casinoId={casinoId}
            player={dialog.row.user}
            currentBalance={dialog.row.balance}
            onClose={() => setDialog({ kind: "none" })}
            onDeposited={(newBalance) => {
              patchRowBalance(dialog.row.user.id, newBalance);
            }}
          />
        )}
      </FormModal>

      <FormModal
        open={dialog.kind === "debit"}
        onClose={() => setDialog({ kind: "none" })}
      >
        {dialog.kind === "debit" && (
          <DebitFromPlayerForm
            casinoId={casinoId}
            player={dialog.row.user}
            currentBalance={dialog.row.balance}
            onClose={() => setDialog({ kind: "none" })}
            onDebited={(newBalance) => {
              patchRowBalance(dialog.row.user.id, newBalance);
            }}
          />
        )}
      </FormModal>
    </div>
  );
}
