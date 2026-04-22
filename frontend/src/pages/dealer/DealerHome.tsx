import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { useAuthStore } from "@/stores/authStore";

export default function DealerHome() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <AppLayout
      title="Tallador"
      right={
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Salir
        </Button>
      }
    >
      <Card tone="felt">
        <div className="flex flex-col gap-2">
          <Badge tone="info">TALLADOR</Badge>
          <h2 className="font-display text-2xl text-[--color-ivory]">
            Bienvenido{user?.fullName ? `, ${user.fullName}` : ""}
          </h2>
          <p className="text-sm text-[--color-cream]/80">
            Panel provisional. Para abrir una mesa, inicia sesión de mesa con el
            QR correspondiente.
          </p>
          <p className="font-mono text-xs text-[--color-cream]/60">
            Matrícula: {user?.matricula} · Rol: {user?.role}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => navigate("/dealer/login")}>
            Abrir mesa
          </Button>
          <Button variant="info" onClick={() => navigate("/dealer/stats")}>
            Ver estadísticas de mesa
          </Button>
        </div>
      </Card>
    </AppLayout>
  );
}
