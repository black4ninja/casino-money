import { Link } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { CasinoSign } from "@/components/organisms/CasinoSign";
import { useSessionStore } from "@/stores/sessionStore";

export default function Landing() {
  const session = useSessionStore((s) => s.session);

  return (
    <AppLayout>
      <CasinoSign />
      {session && (
        <Card tone="night" className="flex items-center gap-3">
          <Badge tone="gold">SESIÓN ACTIVA</Badge>
          <span className="font-label text-sm text-[--color-cream]/90">
            {session.label}
          </span>
        </Card>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        <RoleLink
          to="/player"
          emoji="♠"
          title="Soy jugador"
          desc="Recibir, guardar y apostar mis fichas"
        />
        <RoleLink
          to="/dealer"
          emoji="♦"
          title="Soy tallador"
          desc="Repartir fichas y cobrar apuestas en mi mesa"
        />
        <RoleLink
          to="/admin"
          emoji="♣"
          title="Soy el maestro"
          desc="Crear sesión, distribuir QR y ver estadísticas"
        />
        <RoleLink
          to="/ingest"
          emoji="♡"
          title="Tengo un código"
          desc="Pegar un código o enlace sin usar la cámara"
        />
        <RoleLink
          to="/juegos/ruleta"
          emoji="🎰"
          title="Ruleta de Patrones"
          desc="Gira la ruleta para elegir un patrón de diseño al azar"
        />
        <RoleLink
          to="/dev"
          emoji="⚙"
          title="Simulador"
          desc="Probar todos los flujos en una sola pantalla (sin cámara ni QR)"
        />
      </div>
    </AppLayout>
  );
}

function RoleLink({
  to,
  emoji,
  title,
  desc,
  className,
}: {
  to: string;
  emoji: string;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <Link to={to} className={["block h-full", className ?? ""].join(" ")}>
      <Card className="flex h-full items-center gap-4 hover:border-[--color-gold-500] active:scale-[0.98] transition">
        <span className="text-4xl gold-shine font-display">{emoji}</span>
        <div>
          <h2 className="font-display text-xl text-[--color-ivory]">{title}</h2>
          <p className="text-sm text-[--color-cream]/70">{desc}</p>
        </div>
      </Card>
    </Link>
  );
}
