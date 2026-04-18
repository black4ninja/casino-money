import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { ShareableQR } from "@/components/atoms/ShareableQR";
import { encodeQR } from "@/qr/codec";
import type { IdentityQR } from "@/qr/schemas";
import { QR_VERSION } from "@/qr/schemas";
import { usePlayerStore } from "@/stores/playerStore";

export default function PlayerIdentity() {
  const account = usePlayerStore((s) => s.account);
  if (!account) return <Navigate to="/player" replace />;

  const qr: IdentityQR = {
    v: QR_VERSION,
    type: "identity",
    identity: account.identity,
  };

  return (
    <AppLayout
      title="Mi identidad"
      subtitle="Muéstralo al tallador para recibir fichas"
      back={{ to: "/player/wallet", label: "Cartera" }}
    >
      <Card className="flex flex-col items-center gap-3 py-8">
        <ShareableQR value={encodeQR(qr)} label={account.identity.alias} />
        <p className="font-mono text-xs text-[--color-cream]/50">
          {account.identity.playerId}
        </p>
      </Card>
    </AppLayout>
  );
}
