import { useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";

type Props = {
  onSubmit: (matricula: string, password: string) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
};

export function LoginForm({ onSubmit, loading, error }: Props) {
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    onSubmit(matricula.trim(), password);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Matrícula"
        placeholder="L03137164"
        autoComplete="username"
        autoCapitalize="characters"
        value={matricula}
        onChange={(e) => setMatricula(e.target.value)}
        required
      />
      <div className="relative">
        <Input
          label="Contraseña"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          hint={`${password.length} caracteres`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className="absolute right-3 top-[34px] font-label text-xs tracking-wider text-[--color-gold-300] hover:text-[--color-gold-400]"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          {showPassword ? "OCULTAR" : "MOSTRAR"}
        </button>
      </div>
      {error && (
        <p
          className="font-label text-xs tracking-wider text-[--color-carmine-400]"
          role="alert"
        >
          {error}
        </p>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        block
        disabled={loading || !matricula || !password}
      >
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
