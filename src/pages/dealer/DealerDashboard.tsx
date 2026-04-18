import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ShareableQR } from "@/components/atoms/ShareableQR";
import { useSessionStore } from "@/stores/sessionStore";
import { useDealerStore } from "@/stores/dealerStore";
import { totals } from "@/storage/dealer";
import { encodeQR } from "@/qr/codec";
import { QR_VERSION, type DealerStatsQR } from "@/qr/schemas";

export default function DealerDashboard() {
  const session = useSessionStore((s) => s.session);
  const keypair = useDealerStore((s) => s.keypair);
  const dealerId = useDealerStore((s) => s.dealerId);
  const ledger = useDealerStore((s) => s.ledger);
  const [showStats, setShowStats] = useState(false);

  const uniquePlayers = useMemo(() => {
    if (!ledger) return [];
    const set = new Set<string>();
    for (const r of ledger.issued) set.add(r.issuedTo);
    for (const r of ledger.redeemed) set.add(r.fromPlayer);
    return Array.from(set);
  }, [ledger]);

  if (!session || !keypair || !dealerId || !ledger) {
    return <Navigate to="/dealer" replace />;
  }

  const t = totals(ledger);

  const statsPayload: DealerStatsQR = {
    v: QR_VERSION,
    type: "dealer-stats",
    sessionId: session.sessionId,
    dealerId,
    issuedCount: t.issuedCount,
    issuedAmount: t.issuedAmount,
    redeemedCount: t.redeemedCount,
    redeemedAmount: t.redeemedAmount,
    uniquePlayers,
  };

  return (
    <AppLayout
      title="Tablero"
      subtitle={dealerId}
      back={{ to: "/dealer/menu", label: "Mesa" }}
    >
      <Card className="grid grid-cols-2 gap-3">
        <Stat label="Entregado" value={`$${t.issuedAmount.toLocaleString("es-MX")}`} />
        <Stat label="Cobrado" value={`$${t.redeemedAmount.toLocaleString("es-MX")}`} />
        <Stat label="Fichas entregadas" value={t.issuedCount} />
        <Stat label="Fichas cobradas" value={t.redeemedCount} />
        <Stat
          label="Jugadores únicos"
          value={uniquePlayers.length}
        />
        <Stat label="Neto" value={`$${t.net.toLocaleString("es-MX")}`} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg">Exportar al maestro</h3>
            <p className="text-sm text-[--color-cream]/70">
              Genera un QR con el resumen de esta mesa.
            </p>
          </div>
          <Button onClick={() => setShowStats((v) => !v)}>
            {showStats ? "Ocultar" : "Mostrar QR"}
          </Button>
        </div>
        {showStats && (
          <div className="mt-4 flex justify-center">
            <ShareableQR value={encodeQR(statsPayload)} label="Stats de mesa" />
          </div>
        )}
      </Card>

      <Card tone="night">
        <h3 className="font-label text-sm text-[--color-cream]/80">Últimos movimientos</h3>
        <ul className="mt-3 max-h-64 overflow-y-auto text-sm">
          {[...ledger.issued.map((r) => ({ ...r, kind: "issue" as const })),
            ...ledger.redeemed.map((r) => ({ ...r, kind: "redeem" as const }))]
            .sort((a, b) => b.at - a.at)
            .slice(0, 30)
            .map((r) => (
              <li
                key={r.serial + r.kind}
                className="flex items-center justify-between border-t border-[--color-gold-500]/20 py-2 first:border-t-0"
              >
                <span className="flex items-center gap-2">
                  <Badge tone={r.kind === "issue" ? "gold" : "felt"}>
                    {r.kind === "issue" ? "OUT" : "IN"}
                  </Badge>
                  <span className="text-xs text-[--color-cream]/70">
                    {r.kind === "issue"
                      ? (r.alias ?? r.issuedTo.slice(0, 8))
                      : r.fromPlayer.slice(0, 8)}
                  </span>
                </span>
                <span
                  className={
                    r.kind === "issue"
                      ? "font-display text-[--color-gold-300]"
                      : "font-display text-[--color-ivory]"
                  }
                >
                  ${r.denom}
                </span>
              </li>
            ))}
        </ul>
      </Card>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-[--color-smoke-800]/60 p-3 text-center">
      <p className="font-label text-[10px] text-[--color-cream]/60">{label}</p>
      <p className="font-display text-xl text-[--color-gold-300]">{value}</p>
    </div>
  );
}
