import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { apiLookupMatricula } from "@/lib/authApi";

type Props = {
  onSubmit: (matricula: string, password: string) => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
};

const LOOKUP_DEBOUNCE_MS = 350;

/**
 * Whether to prompt for a password is driven by the backend — the matrícula
 * string shape is NOT reliable for role inference (e.g. a tallador can have
 * an "A…" matrícula just like a player). On every matrícula change we debounce
 * a call to /auth/lookup; the server is the single source of truth.
 */
export function LoginForm({ onSubmit, loading, error }: Props) {
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [lookupInFlight, setLookupInFlight] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // Debounced probe of the backend on every matrícula edit. We cancel the
  // in-flight request if the user keeps typing, so only the latest value wins.
  useEffect(() => {
    const clean = matricula.trim();
    if (!clean) {
      setRequiresPassword(false);
      setLookupInFlight(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLookupInFlight(true);
      apiLookupMatricula(clean)
        .then((res) => {
          if (controller.signal.aborted) return;
          setRequiresPassword(res.requiresPassword);
        })
        .catch(() => {
          // Fail-closed: if the probe fails, don't fabricate a password field;
          // the submit attempt will surface the error.
          if (controller.signal.aborted) return;
          setRequiresPassword(false);
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setLookupInFlight(false);
        });
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [matricula]);

  // When the backend confirms password is needed, auto-focus the field.
  useEffect(() => {
    if (requiresPassword) {
      passwordRef.current?.focus();
    } else {
      setPassword("");
    }
  }, [requiresPassword]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    // Players submit with empty password; the server accepts that.
    onSubmit(matricula.trim(), requiresPassword ? password : "");
  }

  const canSubmit =
    !loading &&
    !lookupInFlight &&
    matricula.trim().length > 0 &&
    (!requiresPassword || password.length > 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Matrícula"
        placeholder="A00000000"
        autoComplete="username"
        autoCapitalize="characters"
        value={matricula}
        onChange={(e) => setMatricula(e.target.value)}
        required
      />

      {/* Password field slides in/out based on the backend lookup. Uses the
          grid-rows 1fr ↔ 0fr trick so the collapse animates height smoothly
          without measuring DOM. */}
      <div
        className={[
          "grid transition-all duration-300 ease-out",
          requiresPassword
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
        aria-hidden={!requiresPassword}
      >
        <div className="overflow-hidden">
          <div className="relative">
            <Input
              ref={passwordRef}
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={requiresPassword}
              hint={`${password.length} caracteres`}
              tabIndex={requiresPassword ? 0 : -1}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[34px] font-label text-xs tracking-wider text-[--color-gold-300] hover:text-[--color-gold-400]"
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              tabIndex={requiresPassword ? 0 : -1}
            >
              {showPassword ? "OCULTAR" : "MOSTRAR"}
            </button>
          </div>
        </div>
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
        disabled={!canSubmit}
      >
        {loading ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
