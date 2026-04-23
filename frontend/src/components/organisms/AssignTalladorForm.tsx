import { useMemo, useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Card } from "../atoms/Card";
import { Badge } from "../atoms/Badge";
import type { AuthUser } from "@/storage/auth";

type Props = {
  /** Full dealer roster (from apiListUsers('dealers')). The form filters
   *  to only active ones so archived/deleted never become assignable. */
  dealers: AuthUser[];
  /** Current assignment — shown pre-highlighted and enables "Quitar". */
  currentTalladorId: string | null;
  /** Submit handler. `null` = unassign. */
  onSubmit: (talladorId: string | null) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

/**
 * Searchable dealer picker. Filters the roster by substring match over
 * both `fullName` and `matricula` — the user needs to be able to find
 * someone regardless of which they remember. Active dealers only; archived
 * ones never show up as assignable options.
 */
export function AssignTalladorForm({
  dealers,
  currentTalladorId,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(currentTalladorId);

  const filtered = useMemo(() => {
    const active = dealers.filter((d) => d.active);
    const needle = query.trim().toLowerCase();
    if (!needle) return active;
    return active.filter((d) => {
      const name = (d.fullName ?? "").toLowerCase();
      const mat = d.matricula.toLowerCase();
      return name.includes(needle) || mat.includes(needle);
    });
  }, [dealers, query]);

  const dirty = selected !== currentTalladorId;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading || !dirty) return;
    await onSubmit(selected);
  }

  async function handleClear() {
    if (loading) return;
    await onSubmit(null);
  }

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-1">
        Asignar tallador
      </h3>
      <p className="font-label text-xs tracking-widest text-[--color-cream]/60 mb-4">
        Busca por nombre o matrícula
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
          aria-label="Talladores disponibles"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center font-label text-xs tracking-wider text-[--color-cream]/50">
              {dealers.length === 0
                ? "No hay talladores registrados en el sistema."
                : "Sin coincidencias."}
            </p>
          ) : (
            filtered.map((d) => {
              const isSelected = selected === d.id;
              const isCurrent = currentTalladorId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelected(d.id)}
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
                  {isCurrent && (
                    <Badge tone={isSelected ? "gold" : "neutral"}>actual</Badge>
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
            variant="info"
            disabled={loading || !dirty || selected === null}
          >
            {loading ? "Guardando…" : "Asignar"}
          </Button>
          {currentTalladorId && (
            <Button
              type="button"
              variant="danger"
              onClick={handleClear}
              disabled={loading}
            >
              Quitar tallador
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
