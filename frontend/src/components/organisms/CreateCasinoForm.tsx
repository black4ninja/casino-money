import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Card } from "../atoms/Card";

type Props = {
  onSubmit: (data: { name: string; date: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

/** Today in YYYY-MM-DD (local time) — used as the min for the date picker. */
function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreateCasinoForm({ onSubmit, onCancel, loading, error }: Props) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  async function handle(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    await onSubmit({ name: name.trim(), date });
  }

  const canSubmit = !loading && name.trim().length > 0 && date.length > 0;

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-4">
        Nuevo casino
      </h3>
      <form onSubmit={handle} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          placeholder="Casino de Viernes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
        <Input
          label="Fecha"
          type="date"
          value={date}
          min={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        {error && (
          <p
            className="font-label text-xs tracking-wider text-[--color-carmine-400]"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button type="submit" variant="primary" disabled={!canSubmit}>
            {loading ? "Creando…" : "Crear casino"}
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
