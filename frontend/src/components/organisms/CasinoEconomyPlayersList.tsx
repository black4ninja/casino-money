import { useMemo, useState } from "react";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { formatMxn } from "@/components/molecules/AmountPicker";
import type { EconomyWalletRow } from "@/lib/economyApi";

type Props = {
  rows: EconomyWalletRow[];
  loading: boolean;
  canDeposit: boolean;
  onDeposit: (row: EconomyWalletRow) => void;
  /**
   * Si se pasa, aparece el botón "Cobrar" al lado de Depositar. Comparte la
   * misma guardia que canDeposit (un casino archivado no puede mover saldos
   * en ninguna dirección). Si el jugador no tiene saldo el botón queda
   * desactivado para evitar una llamada que el backend rechazaría.
   */
  onDebit?: (row: EconomyWalletRow) => void;
  onViewHistory?: (row: EconomyWalletRow) => void;
};

function normalize(s: string): string {
  // NFD separa acentos de sus letras; luego borramos el bloque Unicode de
  // "combining diacritical marks" (U+0300–U+036F). Así "José" coincide con
  // "jose" al buscar.
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Lista los jugadores del casino con su saldo actual. Cada fila expone dos
 * acciones: depositar (abre modal con AmountPicker) y ver historial (abre
 * modal con la lista de transacciones).
 *
 * Buscador: filtra por alias, fullName o matrícula (normaliza acentos y
 * case). La matrícula NO se muestra en la fila para darle espacio al nombre,
 * pero sigue siendo buscable por comodidad en escaneo.
 */
export function CasinoEconomyPlayersList({
  rows,
  loading,
  canDeposit,
  onDeposit,
  onDebit,
  onViewHistory,
}: Props) {
  const [query, setQuery] = useState("");

  const totalInCirculation = useMemo(
    () => rows.reduce((acc, r) => acc + r.balance, 0),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return rows;
    return rows.filter((row) => {
      const p = row.player;
      const haystack = normalize(
        [p.fullName ?? "", p.alias ?? "", p.matricula ?? ""].join(" "),
      );
      return haystack.includes(q);
    });
  }, [rows, query]);

  const headerSubtitle = loading
    ? "Cargando…"
    : query.trim().length > 0
    ? `${filteredRows.length} de ${rows.length} · ${formatMxn(totalInCirculation)} en circulación`
    : `${rows.length} jugador(es) · ${formatMxn(totalInCirculation)} en circulación`;

  return (
    <Card tone="night" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-[--color-ivory]">
            Jugadores y saldos
          </h3>
          <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
            {headerSubtitle}
          </p>
        </div>
      </div>

      {rows.length > 0 && (
        <Input
          name="economy-player-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o matrícula…"
          autoComplete="off"
        />
      )}

      {!loading && rows.length === 0 && (
        <p className="font-label text-sm text-[--color-cream]/70">
          Este casino aún no tiene jugadores. Asigna departamentos para
          materializar el roster.
        </p>
      )}

      {rows.length > 0 && filteredRows.length === 0 && (
        <p className="font-label text-sm text-[--color-cream]/70">
          Ningún jugador coincide con “{query.trim()}”.
        </p>
      )}

      {filteredRows.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filteredRows.map((row) => {
            const p = row.player;
            const displayName =
              p.alias || p.fullName || p.matricula || "(sin nombre)";
            return (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-[--color-smoke]/60 px-4 py-3 ring-1 ring-inset ring-white/5"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="font-display text-lg truncate"
                      style={{ color: "var(--color-gold-300)" }}
                    >
                      {displayName}
                    </span>
                    {row.walletId === null && (
                      <Badge tone="neutral">sin monedero</Badge>
                    )}
                  </div>
                  {p.departamento && (
                    <div className="mt-0.5 font-label text-[0.7rem] tracking-[0.25em] text-[--color-cream]/60">
                      {p.departamento}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end min-w-[96px]">
                  <span className="font-label text-[0.65rem] tracking-[0.3em] text-[--color-cream]/55">
                    Saldo
                  </span>
                  <span className="font-display text-lg text-[--color-gold-300]">
                    {formatMxn(row.balance)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onDeposit(row)}
                    disabled={!canDeposit}
                    title={
                      canDeposit
                        ? undefined
                        : "Reactiva el casino para depositar"
                    }
                  >
                    Depositar
                  </Button>
                  {onDebit && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDebit(row)}
                      disabled={!canDeposit || row.balance <= 0}
                      title={
                        !canDeposit
                          ? "Reactiva el casino para cobrar"
                          : row.balance <= 0
                            ? "El jugador no tiene saldo"
                            : undefined
                      }
                    >
                      Cobrar
                    </Button>
                  )}
                  {onViewHistory && (
                    <Button
                      variant="info"
                      size="sm"
                      onClick={() => onViewHistory(row)}
                    >
                      Historial
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
