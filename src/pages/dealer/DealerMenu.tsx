import { Link, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Balance } from "@/components/atoms/Balance";
import { Badge } from "@/components/atoms/Badge";
import { useSessionStore } from "@/stores/sessionStore";
import { useDealerStore } from "@/stores/dealerStore";
import { totals } from "@/storage/dealer";

export default function DealerMenu() {
  const session = useSessionStore((s) => s.session);
  const keypair = useDealerStore((s) => s.keypair);
  const dealerId = useDealerStore((s) => s.dealerId);
  const ledger = useDealerStore((s) => s.ledger);
  const logout = useDealerStore((s) => s.logout);

  if (!session) return <Navigate to="/dealer" replace />;
  if (!keypair || !ledger) return <Navigate to="/dealer" replace />;

  const t = totals(ledger);

  return (
    <AppLayout
      title={dealerId ?? "Mesa"}
      subtitle={session.label}
      back={{ to: "/", label: "Salir" }}
      right={
        <Button variant="ghost" size="sm" onClick={logout}>
          Cerrar mesa
        </Button>
      }
    >
      <Card className="flex flex-col items-center gap-2 py-6">
        <Badge tone="gold">CAJA NETA</Badge>
        <Balance amount={t.net} size="xl" />
        <div className="grid grid-cols-2 gap-3 pt-4 text-center text-xs text-[--color-cream]/70">
          <div>
            <p className="font-label">ENTREGADO</p>
            <p className="font-display text-lg text-[--color-ivory]">
              ${t.issuedAmount.toLocaleString("es-MX")}
            </p>
            <p>{t.issuedCount} fichas</p>
          </div>
          <div>
            <p className="font-label">COBRADO</p>
            <p className="font-display text-lg text-[--color-ivory]">
              ${t.redeemedAmount.toLocaleString("es-MX")}
            </p>
            <p>{t.redeemedCount} fichas</p>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/dealer/emit" className="block">
          <Button variant="gold" block>Emitir fichas</Button>
        </Link>
        <Link to="/dealer/redeem" className="block">
          <Button variant="felt" block>Cobrar apuesta</Button>
        </Link>
        <Link to="/dealer/dashboard" className="col-span-2 block">
          <Button variant="ghost" block>Tablero y exportar</Button>
        </Link>
      </div>
    </AppLayout>
  );
}
