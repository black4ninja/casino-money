import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Card } from "../atoms/Card";

type Props = {
  /** "maestro" | "tallador" | "jugador" — used in copy. */
  roleLabel: string;
  /** Discriminator for role-specific fields (departamento, password). */
  isPlayer: boolean;
  onSubmit: (data: {
    matricula: string;
    password: string;
    fullName: string;
    departamento: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
};

export function CreateUserForm({
  roleLabel,
  isPlayer,
  onSubmit,
  onCancel,
  loading,
  error,
}: Props) {
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [departamento, setDepartamento] = useState("");

  async function handle(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    await onSubmit({
      matricula: matricula.trim(),
      password,
      fullName: fullName.trim(),
      departamento: departamento.trim(),
    });
  }

  // Players sign in without a password (by design), so the staff-only
  // 8-char rule shouldn't block player creation.
  const passwordInvalid = !isPlayer && password.length < 8;

  return (
    <Card tone="night">
      <h3 className="font-display text-xl text-[--color-ivory] mb-4">
        Nuevo {roleLabel}
      </h3>
      <form onSubmit={handle} className="flex flex-col gap-4">
        <Input
          label="Matrícula"
          placeholder="L00000000"
          autoCapitalize="characters"
          value={matricula}
          onChange={(e) => setMatricula(e.target.value)}
          required
        />
        <Input
          label="Nombre completo"
          placeholder={isPlayer ? "Opcional" : "Opcional"}
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
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            hint="Mínimo 8 caracteres"
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
            variant="primary"
            disabled={loading || !matricula || passwordInvalid}
          >
            {loading ? "Creando…" : `Crear ${roleLabel}`}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
