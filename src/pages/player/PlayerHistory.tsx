import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { useSessionStore } from "@/stores/sessionStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { HistoryEntry } from "@/domain/types";

export default function PlayerHistory() {
  const session = useSessionStore((s) => s.session);
  const account = usePlayerStore((s) => s.account);
  const history = usePlayerStore((s) =>
    session ? (s.historyBySession[session.sessionId] ?? []) : [],
  );

  if (!session || !account) return <Navigate to="/player" replace />;
  const sorted = [...history].sort((a, b) => b.at - a.at);

  return (
    <AppLayout
      title="Historial"
      subtitle={session.label}
      back={{ to: "/player/wallet", label: "Cartera" }}
    >
      {sorted.length === 0 ? (
        <Card>
          <p className="text-sm text-[--color-cream]/70">Aún no hay movimientos.</p>
        </Card>
      ) : (
        <Card className="flex flex-col gap-3">
          {sorted.map((entry) => (
            <Row key={entry.serial + entry.kind + entry.at} entry={entry} />
          ))}
        </Card>
      )}
    </AppLayout>
  );
}

function Row({ entry }: { entry: HistoryEntry }) {
  const sign =
    entry.kind === "receive" || entry.kind === "transfer-in" ? "+" : "-";
  const tone =
    sign === "+" ? "text-[--color-gold-300]" : "text-[--color-carmine-400]";
  const icon: Record<HistoryEntry["kind"], string> = {
    receive: "♤",
    redeem: "♧",
    "transfer-in": "↙",
    "transfer-out": "↗",
  };
  const labelByKind: Record<HistoryEntry["kind"], string> = {
    receive: "Recibido de",
    redeem: "Pagado a",
    "transfer-in": "Transferido de",
    "transfer-out": "Transferido a",
  };
  const counterparty =
    entry.kind === "receive"
      ? entry.from
      : entry.kind === "redeem"
        ? entry.to
        : entry.kind === "transfer-in"
          ? (entry.alias ?? entry.from)
          : (entry.alias ?? entry.to);

  return (
    <div className="flex items-start justify-between gap-3 border-t border-[--color-gold-500]/20 pt-3 first:border-t-0 first:pt-0">
      <div className="flex gap-3">
        <span className="font-display text-2xl">{icon[entry.kind]}</span>
        <div>
          <p className="text-sm text-[--color-cream]">
            {labelByKind[entry.kind]}{" "}
            <span className="font-label text-xs text-[--color-cream]/60">
              {counterparty}
            </span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-[--color-cream]/40">
            {new Date(entry.at).toLocaleString("es-MX")} · {entry.serial.slice(0, 8)}
          </p>
        </div>
      </div>
      <Badge tone={sign === "+" ? "gold" : "neutral"}>
        <span className={tone}>
          {sign}${entry.denom.toLocaleString("es-MX")}
        </span>
      </Badge>
    </div>
  );
}
