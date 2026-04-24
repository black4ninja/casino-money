import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { GAMES } from "@/domain/games";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initialGameType?: string;
  onSubmit: (data: { gameType: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

/**
 * Single form used for both creating and editing a mesa — only difference
 * is the header label and submit copy. The sole field is the gameType
 * picked from the shared games catalog. Tallador assignment is deliberately
 * out of scope at this stage.
 */
export function MesaForm({
  mode,
  initialGameType,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [gameType, setGameType] = useState(initialGameType ?? "");

  async function handle(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!gameType) return;
    await onSubmit({ gameType });
  }

  const title = mode === "create" ? "Nueva mesa" : "Editar mesa";
  const submitIdle = mode === "create" ? "Crear mesa" : "Guardar cambios";
  const submitLoading = mode === "create" ? "Creando…" : "Guardando…";
  const submitVariant = mode === "create" ? "primary" : "info";

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-1">
        {title}
      </h3>
      <p className="font-label text-xs tracking-widest text-[--color-cream]/60 mb-4">
        Selecciona el tipo de juego
      </p>
      <form onSubmit={handle} className="flex flex-col gap-4">
        <ul
          role="radiogroup"
          aria-label="Tipo de juego"
          className="flex max-h-[55vh] flex-col gap-1.5 overflow-y-auto rounded-xl bg-[--color-felt-900]/40 p-2 ring-1 ring-inset ring-white/5"
        >
          {GAMES.map((g) => {
            const selected = gameType === g.id;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setGameType(g.id)}
                  role="radio"
                  aria-checked={selected}
                  className={[
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                    "font-label text-base tracking-wide",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]",
                    selected
                      ? "bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)] text-white shadow-[inset_0_0_0_2px_var(--color-chip-blue-300),inset_0_0_0_3px_rgba(255,255,255,0.35)]"
                      : "bg-[--color-smoke]/70 text-[--color-cream]/85 hover:bg-[--color-smoke]/90 hover:text-[--color-ivory]",
                  ].join(" ")}
                >
                  <span aria-hidden className="text-2xl leading-none shrink-0">
                    {g.emoji}
                  </span>
                  <span className="font-display text-lg truncate">
                    {g.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {error && (
          <p
            className="font-label text-xs tracking-wider text-[--color-carmine-400]"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            variant={submitVariant}
            disabled={loading || !gameType}
          >
            {loading ? submitLoading : submitIdle}
          </Button>
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
