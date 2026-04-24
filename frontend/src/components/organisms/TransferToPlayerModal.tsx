import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { FormModal } from "@/components/molecules/FormModal";
import { TransferToPlayerForm } from "@/components/organisms/TransferToPlayerForm";
import { useAuthStore } from "@/stores/authStore";
import { apiListMyCasinoPlayers } from "@/lib/economyApi";
import type { ApiError } from "@/lib/authApi";
import type { AuthUser } from "@/storage/auth";

type Props = {
  open: boolean;
  casinoId: string;
  /** Saldo actual del jugador autenticado en este casino. */
  senderBalance: number;
  onClose: () => void;
  /** Callback tras transferencia exitosa con el nuevo saldo del emisor. */
  onTransferred: (newSenderBalance: number) => void;
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Modal de dos pasos para transferir fichas a otro jugador del mismo casino:
 *
 *   Paso 1 (pick): lista del roster con buscador por nombre/matrícula.
 *   Paso 2 (amount): TransferToPlayerForm con el destinatario elegido.
 *
 * Reutiliza el mismo FormModal que depósito/cobro del dealer para mantener
 * una sola geometría de overlay. La lista no muestra saldos (privacidad entre
 * jugadores); sólo alias/fullName/matricula/departamento para elegir.
 */
export function TransferToPlayerModal({
  open,
  casinoId,
  senderBalance,
  onClose,
  onTransferred,
}: Props) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const refresh = useAuthStore((s) => s.refresh);

  const [players, setPlayers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<AuthUser | null>(null);

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

  // Reset al abrir: limpia estado de selección/búsqueda/resultado previo para
  // que el modal siempre arranque en el paso 1 sin datos fantasma.
  useEffect(() => {
    if (!open) return;
    setPicked(null);
    setQuery("");
    setLoadError(null);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { players } = await withAuth((t) =>
          apiListMyCasinoPlayers(t, casinoId),
        );
        if (!cancelled) setPlayers(players);
      } catch (err) {
        if (cancelled) return;
        const e = err as ApiError;
        setLoadError(e.message ?? "No se pudo cargar el roster del casino.");
        setPlayers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, casinoId, withAuth]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return players;
    return players.filter((p) => {
      const haystack = normalize(
        [p.fullName ?? "", p.alias ?? "", p.matricula ?? ""].join(" "),
      );
      return haystack.includes(q);
    });
  }, [players, query]);

  return (
    <FormModal open={open} onClose={onClose}>
      {picked ? (
        <TransferToPlayerForm
          casinoId={casinoId}
          recipient={picked}
          senderBalance={senderBalance}
          onBack={() => setPicked(null)}
          onClose={onClose}
          onTransferred={onTransferred}
        />
      ) : (
        <Card tone="night" className="flex flex-col gap-5 !p-7 sm:!p-9">
          <div className="flex flex-col gap-1">
            <Badge tone="success">Transferir fichas</Badge>
            <h2 className="font-display text-2xl text-[--color-ivory]">
              Elige a quién mandarle
            </h2>
            <p className="font-label text-xs tracking-widest text-[--color-cream]/60">
              {loading
                ? "Cargando jugadores…"
                : players.length === 0
                  ? "Todavía no hay otros jugadores en este casino"
                  : `${filtered.length} de ${players.length} jugador(es)`}
            </p>
          </div>

          {loadError && (
            <p
              role="alert"
              className="font-label text-sm tracking-wider text-[--color-chip-red-300]"
            >
              {loadError}
            </p>
          )}

          {players.length > 0 && (
            <Input
              name="transfer-player-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o matrícula…"
              autoComplete="off"
            />
          )}

          {!loading && !loadError && players.length > 0 && filtered.length === 0 && (
            <p className="font-label text-sm text-[--color-cream]/70">
              Ningún jugador coincide con “{query.trim()}”.
            </p>
          )}

          {filtered.length > 0 && (
            <ul className="flex max-h-[50vh] flex-col gap-3 overflow-y-auto px-1 py-1 pr-3">
              {filtered.map((p) => {
                const displayName =
                  p.alias || p.fullName || p.matricula || "(sin nombre)";
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-4 rounded-xl bg-[--color-smoke]/70 px-5 py-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display text-lg truncate"
                        style={{ color: "var(--color-gold-300)" }}
                      >
                        {displayName}
                      </div>
                      {p.departamento && (
                        <div className="mt-1 font-label text-[0.7rem] tracking-[0.25em] text-[--color-cream]/60">
                          {p.departamento}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setPicked(p)}
                    >
                      Elegir
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}
    </FormModal>
  );
}
