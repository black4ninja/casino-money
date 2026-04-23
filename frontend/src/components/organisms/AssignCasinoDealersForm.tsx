import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Card } from "../atoms/Card";
import { Badge } from "../atoms/Badge";
import type { AuthUser } from "@/storage/auth";

type Props = {
  /** Every active dealer in the catalog. */
  availableDealers: AuthUser[];
  /** Dealer ids already assigned to the casino. */
  currentDealerIds: string[];
  onSubmit: (dealerIds: string[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

/**
 * Multi-select for the casino.dealerIds field. A mesa in this casino will
 * only accept a tallador from this list (once it's non-empty). Unlike the
 * mesa-level dealer picker, this form is where the admin curates the pool.
 */
export function AssignCasinoDealersForm({
  availableDealers,
  currentDealerIds,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(currentDealerIds),
  );

  const activeDealers = useMemo(
    () => availableDealers.filter((d) => d.active),
    [availableDealers],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return activeDealers;
    return activeDealers.filter((d) => {
      const name = (d.fullName ?? "").toLowerCase();
      const mat = d.matricula.toLowerCase();
      return name.includes(needle) || mat.includes(needle);
    });
  }, [activeDealers, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const dirty = useMemo(() => {
    if (selected.size !== currentDealerIds.length) return true;
    for (const id of currentDealerIds) if (!selected.has(id)) return true;
    return false;
  }, [selected, currentDealerIds]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !dirty) return;
    await onSubmit(Array.from(selected));
  }

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-1">
        Talladores del casino
      </h3>
      <p className="font-label text-xs tracking-widest text-[--color-cream]/60 mb-4">
        Selecciona qué talladores podrán asignarse a las mesas de este casino.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Buscar"
          placeholder="Matrícula o nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div
          className="flex max-h-72 flex-col gap-1.5 overflow-y-auto rounded-xl bg-[--color-felt-900]/40 p-2 ring-1 ring-inset ring-white/5"
          role="listbox"
          aria-multiselectable="true"
          aria-label="Talladores disponibles"
        >
          {activeDealers.length === 0 ? (
            <p className="px-3 py-6 text-center font-label text-xs tracking-wider text-[--color-cream]/50">
              No hay talladores activos en el sistema.
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center font-label text-xs tracking-wider text-[--color-cream]/50">
              Sin coincidencias.
            </p>
          ) : (
            filtered.map((d) => {
              const isSelected = selected.has(d.id);
              const wasSelected = currentDealerIds.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(d.id)}
                  className={[
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]",
                    isSelected
                      ? "bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)] text-white shadow-[inset_0_0_0_2px_var(--color-chip-blue-300),inset_0_0_0_3px_rgba(255,255,255,0.35)]"
                      : "bg-[--color-smoke]/70 text-[--color-cream]/85 hover:bg-[--color-smoke]/90 hover:text-[--color-ivory]",
                  ].join(" ")}
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="font-display text-base truncate">
                      {d.fullName ?? "(sin nombre)"}
                    </span>
                    <span className="font-mono text-xs opacity-85">
                      {d.matricula}
                    </span>
                  </div>
                  {wasSelected && !isSelected && (
                    <Badge tone="neutral">se quitará</Badge>
                  )}
                  {!wasSelected && isSelected && (
                    <Badge tone="success">nuevo</Badge>
                  )}
                </button>
              );
            })
          )}
        </div>

        {error && (
          <p
            className="font-label text-xs tracking-wider text-[--color-carmine-400]"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !dirty}
          >
            {loading ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <span className="ml-auto font-label text-xs tracking-widest text-[--color-cream]/60">
            {selected.size} seleccionado(s)
          </span>
        </div>
      </form>
    </Card>
  );
}
