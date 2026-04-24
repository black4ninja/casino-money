import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/atoms/Card";
import { CasinoSign } from "@/components/organisms/CasinoSign";
import { LoginForm } from "@/components/molecules/LoginForm";
import { useAuthStore } from "@/stores/authStore";
import type { ApiError } from "@/lib/authApi";
import type { Role } from "@/storage/auth";

function landingFor(role: Role): string {
  if (role === "master") return "/admin";
  if (role === "dealer") return "/dealer";
  return "/player";
}

export default function Login() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to the appropriate dashboard.
  useEffect(() => {
    if (user) navigate(landingFor(user.role), { replace: true });
  }, [user, navigate]);

  if (user) return <Navigate to={landingFor(user.role)} replace />;

  async function handleLogin(matricula: string, password: string) {
    setError(null);
    try {
      await login(matricula, password);
    } catch (err) {
      const e = err as ApiError;
      if (e.code === "INVALID_CREDENTIALS" || e.status === 401) {
        setError("Matrícula o contraseña incorrectas");
      } else if (e.code === "INACTIVE_ACCOUNT") {
        setError("Cuenta inactiva. Contacta al maestro.");
      } else if (e.code === "PASSWORD_REQUIRED") {
        setError("Esta cuenta requiere contraseña.");
      } else {
        setError(e.message || "No pudimos iniciar sesión");
      }
    }
  }

  return (
    <div className="landing-bg flex min-h-full w-full items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="w-full">
          <CasinoSign />
        </div>
        <div className="w-full">
          <Card
            tone="glass"
            style={{
              marginInline: 0,
              paddingInline: "1.5rem",
              paddingBlock: "1.75rem",
            }}
          >
            <h2 className="gold-shine font-display text-3xl text-center mb-2">
              Iniciar sesión
            </h2>
            <p className="font-label text-center text-xs tracking-[0.2em] text-[--color-cream]/60 mb-6">
              Ingresa con tu matrícula
            </p>
            <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
          </Card>
        </div>
      </div>
    </div>
  );
}
