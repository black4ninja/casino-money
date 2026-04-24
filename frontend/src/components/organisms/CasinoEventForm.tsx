import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import {
  CASINO_EVENT_META,
  type CasinoEventType,
} from "@/lib/casinoEventsApi";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initialName?: string;
  initialType?: CasinoEventType;
  onSubmit: (data: { name: string; type: CasinoEventType }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

const TYPE_ORDER: CasinoEventType[] = ["WIN_DOUBLE", "LOSS_DOUBLE"];

/**
 * Form compartido para crear o editar un evento del casino. Los únicos
 * campos son el nombre visible para el jugador y el tipo de efecto. El
 * tipo queda bloqueado en modo edit — cambiarlo redefiniría la semántica
 * del registro, mejor archivar y crear uno nuevo.
 */
export function CasinoEventForm({
  mode,
  initialName,
  initialType,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [type, setType] = useState<CasinoEventType>(initialType ?? "WIN_DOUBLE");

  async function handle(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({ name: trimmed, type });
  }

  const title = mode === "create" ? "Nuevo evento" : "Editar evento";
  const submitIdle = mode === "create" ? "Crear evento" : "Guardar cambios";
  const submitLoading = mode === "create" ? "Creando…" : "Guardando…";
  const submitVariant = mode === "create" ? "primary" : "info";
  const typeLocked = mode === "edit";

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-1">
        {title}
      </h3>
      <p className="font-label text-xs tracking-widest text-[--color-cream]/60 mb-4">
        {mode === "create"
          ? "Dale un nombre y elige el efecto"
          : "El efecto del evento no puede cambiarse — archívalo y crea uno nuevo si necesitas otro tipo"}
      </p>
      <form onSubmit={handle} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-label text-xs tracking-[0.25em] text-[--color-cream]/70">
            Nombre visible al jugador
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            autoFocus
            placeholder="Ej. Noche de la suerte"
            className="rounded-lg bg-[--color-felt-900]/60 px-3 py-2 font-display text-lg text-[--color-ivory] ring-1 ring-inset ring-[--color-gold-500]/30 focus:ring-[--color-gold-400] focus-visible:outline-none"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="font-label text-xs tracking-[0.25em] text-[--color-cream]/70">
            Efecto
          </span>
          <ul
            role="radiogroup"
            aria-label="Tipo de evento"
            className="flex flex-col gap-1.5 rounded-xl bg-[--color-felt-900]/40 p-2 ring-1 ring-inset ring-white/5"
          >
            {TYPE_ORDER.map((t) => {
              const meta = CASINO_EVENT_META[t];
              const selected = type === t;
              return (
                <li key={t}>
                  <button
                    type="button"
                    disabled={typeLocked && !selected}
                    onClick={() => !typeLocked && setType(t)}
                    role="radio"
                    aria-checked={selected}
                    className={[
                      "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-gold-400]",
                      selected
                        ? "bg-gradient-to-b from-[var(--color-chip-blue-400)] to-[var(--color-chip-blue-500)] text-white shadow-[inset_0_0_0_2px_var(--color-chip-blue-300),inset_0_0_0_3px_rgba(255,255,255,0.35)]"
                        : "bg-[--color-smoke]/70 text-[--color-cream]/85 hover:bg-[--color-smoke]/90 hover:text-[--color-ivory]",
                      typeLocked && !selected ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  >
                    <span aria-hidden className="text-2xl leading-none shrink-0">
                      {meta.emoji}
                    </span>
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-display text-lg">{meta.label}</span>
                      <span className="font-label text-xs opacity-85">
                        {meta.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

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
            disabled={loading || !name.trim()}
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
