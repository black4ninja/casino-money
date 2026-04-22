import { useState } from "react";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ScannerPanel } from "@/components/organisms/ScannerPanel";
import { decodeQR } from "@/qr/codec";
import type { DealerStatsQR } from "@/qr/schemas";
import { useSessionStore } from "@/stores/sessionStore";

type MesaRow = DealerStatsQR & { importedAt: number };

export default function AdminOverview() {
  const session = useSessionStore((s) => s.session);
  const [rows, setRows] = useState<Record<string, MesaRow>>({});
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <AppLayout
        title="Estadísticas"
        back={{ to: "/admin", label: "Admin" }}
      >
        <Card tone="night">
          <p className="text-sm">No hay sesión activa en este dispositivo.</p>
        </Card>
      </AppLayout>
    );
  }

  function handleScan(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.payload.type !== "dealer-stats") {
      setError("Ese QR no son estadísticas de mesa.");
      return;
    }
    const stats = r.payload;
    if (stats.sessionId !== session!.sessionId) {
      setError("Las estadísticas son de otra sesión.");
      return;
    }
    const row: MesaRow = { ...stats, importedAt: Date.now() };
    setRows((prev) => ({ ...prev, [stats.dealerId]: row }));
    setError(null);
    setScanning(false);
  }

  const mesas = Object.values(rows);
  const totals = mesas.reduce(
    (acc, r) => ({
      issued: acc.issued + r.issuedAmount,
      redeemed: acc.redeemed + r.redeemedAmount,
      players: new Set([...acc.players, ...r.uniquePlayers]),
    }),
    { issued: 0, redeemed: 0, players: new Set<string>() },
  );

  return (
    <AppLayout
      title="Estadísticas"
      subtitle="Importa los QR de estadística de cada mesa"
      back={{ to: "/admin", label: "Admin" }}
    >
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Badge tone="gold">{session.label}</Badge>
          <span className="text-xs text-[--color-cream]/60 font-mono">
            {session.sessionId.slice(0, 8)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Mesas" value={mesas.length} />
          <Stat label="Jugadores" value={totals.players.size} />
          <Stat
            label="Saldo neto"
            value={`$${(totals.issued - totals.redeemed).toLocaleString("es-MX")}`}
          />
          <Stat label="Entregado" value={`$${totals.issued.toLocaleString("es-MX")}`} />
          <Stat label="Cobrado" value={`$${totals.redeemed.toLocaleString("es-MX")}`} />
        </div>
      </Card>

      <Card tone="night">
        {scanning ? (
          <div className="flex flex-col gap-3">
            <ScannerPanel onDecoded={handleScan} />
            <Button variant="ghost" onClick={() => setScanning(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="gold" onClick={() => setScanning(true)} block>
            Importar estadísticas de mesa
          </Button>
        )}
        {error && (
          <p className="mt-3 text-sm text-[--color-carmine-400]">{error}</p>
        )}
      </Card>

      {mesas.length > 0 && (
        <Card>
          <h2 className="font-label text-sm text-[--color-cream]/80">
            Detalle por mesa
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead className="font-label text-xs text-[--color-cream]/60">
              <tr>
                <th className="text-left">Mesa</th>
                <th className="text-right">Entregado</th>
                <th className="text-right">Cobrado</th>
                <th className="text-right">Neto</th>
              </tr>
            </thead>
            <tbody>
              {mesas.map((m) => {
                const net = m.issuedAmount - m.redeemedAmount;
                return (
                  <tr
                    key={m.dealerId}
                    className="border-t border-[--color-gold-500]/20"
                  >
                    <td className="py-2">{m.dealerId}</td>
                    <td className="text-right">${m.issuedAmount.toLocaleString("es-MX")}</td>
                    <td className="text-right">${m.redeemedAmount.toLocaleString("es-MX")}</td>
                    <td
                      className={`text-right font-bold ${net >= 0 ? "text-[--color-gold-300]" : "text-[--color-carmine-400]"}`}
                    >
                      ${net.toLocaleString("es-MX")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </AppLayout>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-[--color-smoke-800]/60 p-3 text-center">
      <p className="font-label text-xs text-[--color-cream]/60">{label}</p>
      <p className="font-display text-xl text-[--color-gold-300]">{value}</p>
    </div>
  );
}
