import { Link } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";

export default function Juegos() {
  return (
    <AppLayout
      title="Juegos"
      subtitle="Para animar la clase"
      back={{ to: "/" }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Link to="/juegos/ruleta" className="block h-full">
          <Card className="flex h-full items-center gap-4 hover:border-[--color-gold-500] active:scale-[0.98] transition">
            <span className="gold-shine font-display text-4xl">🎰</span>
            <div>
              <h2 className="font-display text-xl text-[--color-ivory]">
                Ruleta de Patrones
              </h2>
              <p className="text-sm text-[--color-cream]/70">
                Gírala para elegir al azar un patrón de diseño de GoF.
              </p>
            </div>
          </Card>
        </Link>
      </div>
    </AppLayout>
  );
}
