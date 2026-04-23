import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Card } from "../atoms/Card";
import type { Casino } from "@/lib/casinoApi";

type Props = {
  casino: Casino;
  onSubmit: (data: { name: string; date: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

/** ISO (from backend) → YYYY-MM-DD local for the date input. */
function toInputDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function EditCasinoForm({
  casino,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [name, setName] = useState(casino.name);
  const [date, setDate] = useState(toInputDate(casino.date));

  async function handle(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    await onSubmit({ name: name.trim(), date });
  }

  const canSubmit = !loading && name.trim().length > 0 && date.length > 0;

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-4">
        Editar casino
      </h3>
      <form onSubmit={handle} className="flex flex-col gap-4">
        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
        />
        <Input
          label="Fecha"
          type="date"
          value={date}
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
          <Button type="submit" variant="info" disabled={!canSubmit}>
            {loading ? "Guardando…" : "Guardar cambios"}
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
