import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { useAuthStore } from "@/stores/authStore";

export default function PlayerDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <AppLayout
      title="Jugador"
      right={
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Salir
        </Button>
      }
    >
      <Card tone="felt">
        <div className="flex flex-col gap-2">
          <Badge tone="felt">JUGADOR</Badge>
          <h2 className="font-display text-2xl text-[--color-ivory]">
            Bienvenido{user?.fullName ? `, ${user.fullName}` : ""}
          </h2>
          <p className="text-sm text-[--color-cream]/80">
            Este panel es provisional. Pronto agregaremos tus fichas, historial y
            pagos desde aquí.
          </p>
          <p className="font-mono text-xs text-[--color-cream]/60">
            Matrícula: {user?.matricula}
          </p>
        </div>
      </Card>
    </AppLayout>
  );
}
