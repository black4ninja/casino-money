import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Card } from "../atoms/Card";
import type { AuthUser } from "@/storage/auth";

type Props = {
  user: AuthUser;
  /** "maestro" | "tallador" | "jugador" — used in copy. */
  roleLabel: string;
  onSubmit: (data: {
    fullName: string | null;
    departamento?: string | null;
    password?: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

/**
 * Edit form — mirrors CreateUserForm but with these differences:
 *   • Matrícula is shown read-only (it's the stable identifier).
 *   • Password is optional — blank means "keep current password".
 *   • Empty fullName clears the field (sent as null to the API).
 *   • Departamento is shown only for player accounts.
 */
export function EditUserForm({
  user,
  roleLabel,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [departamento, setDepartamento] = useState(user.departamento ?? "");
  const [password, setPassword] = useState("");
  const isPlayer = user.role === "player";

  async function handle(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    const trimmedName = fullName.trim();
    const trimmedDept = departamento.trim();
    await onSubmit({
      fullName: trimmedName.length > 0 ? trimmedName : null,
      departamento: isPlayer
        ? trimmedDept.length > 0
          ? trimmedDept
          : null
        : undefined,
      password: password.length > 0 ? password : undefined,
    });
  }

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-1">
        Editar {roleLabel}
      </h3>
      <p className="font-mono text-xs text-[--color-gold-300] mb-4">
        {user.matricula}
      </p>
      <form onSubmit={handle} className="flex flex-col gap-4">
        <Input
          label="Nombre completo"
          placeholder="Opcional"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        {isPlayer && (
          <Input
            label="Departamento"
            placeholder="Ej. ITC, IMT"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
          />
        )}
        {!isPlayer && (
          <Input
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={password.length > 0 ? 8 : undefined}
            hint="Deja en blanco para conservar la actual"
          />
        )}
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
            variant="info"
            disabled={loading || (password.length > 0 && password.length < 8)}
          >
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
