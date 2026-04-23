import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Card } from "../atoms/Card";
import { Badge } from "../atoms/Badge";

type Props = {
  /** Every `departamento` string currently in use by active players. */
  availableDepartamentos: string[];
  /** Currently selected departamentos for the casino. */
  currentDepartamentos: string[];
  onSubmit: (departamentos: string[]) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

/**
 * Multi-select for the casino.departamentos field. A casino's player roster
 * is derived dynamically from this list — no separate assignment table. The
 * user picks department names and the backend materializes the players.
 */
export function AssignCasinoDepartamentosForm({
  availableDepartamentos,
  currentDepartamentos,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(currentDepartamentos),
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return availableDepartamentos;
    return availableDepartamentos.filter((d) =>
      d.toLowerCase().includes(needle),
    );
  }, [availableDepartamentos, query]);

  function toggle(dept: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  }

  const dirty = useMemo(() => {
    if (selected.size !== currentDepartamentos.length) return true;
    for (const d of currentDepartamentos) if (!selected.has(d)) return true;
    return false;
  }, [selected, currentDepartamentos]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !dirty) return;
    await onSubmit(Array.from(selected).sort((a, b) => a.localeCompare(b, "es")));
  }

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-1">
        Departamentos del casino
      </h3>
      <p className="font-label text-xs tracking-widest text-[--color-cream]/60 mb-4">
        Los jugadores cuyo departamento esté seleccionado juegan en este casino.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Buscar"
          placeholder="Filtrar por nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div
          className="flex max-h-72 flex-col gap-1.5 overflow-y-auto rounded-xl bg-[--color-felt-900]/40 p-2 ring-1 ring-inset ring-white/5"
          role="listbox"
          aria-multiselectable="true"
          aria-label="Departamentos disponibles"
        >
          {availableDepartamentos.length === 0 ? (
            <p className="px-3 py-6 text-center font-label text-xs tracking-wider text-[--color-cream]/50">
              No hay departamentos capturados. Crea jugadores con un
              departamento para que aparezcan aquí.
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-6 text-center font-label text-xs tracking-wider text-[--color-cream]/50">
              Sin coincidencias.
            </p>
          ) : (
            filtered.map((dept) => {
              const isSelected = selected.has(dept);
              const wasSelected = currentDepartamentos.includes(dept);
              return (
                <button
                  key={dept}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(dept)}
                  className={[
                    "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]",
                    isSelected
                      ? "bg-gradient-to-b from-[var(--color-felt-600)] to-[var(--color-felt-700)] text-[--color-cream] shadow-[inset_0_0_0_2px_var(--color-gold-500),inset_0_0_0_3px_rgba(255,255,255,0.25)]"
                      : "bg-[--color-smoke]/70 text-[--color-cream]/85 hover:bg-[--color-smoke]/90 hover:text-[--color-ivory]",
                  ].join(" ")}
                >
                  <span className="font-display text-base truncate">{dept}</span>
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
