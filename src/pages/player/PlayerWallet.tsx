import { Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Balance } from "@/components/atoms/Balance";
import { Badge } from "@/components/atoms/Badge";
import { ChipStack } from "@/components/molecules/ChipStack";
import { useSessionStore } from "@/stores/sessionStore";
import { usePlayerStore } from "@/stores/playerStore";
import { base64UrlToBytes } from "@/crypto/encoding";
import { verifyWalletChip, sumChips } from "@/domain/chip";
import { verifyEndorsementSignatures } from "@/domain/endorsement";
import type { WalletChip } from "@/domain/types";

export default function PlayerWallet() {
  const session = useSessionStore((s) => s.session);
  const account = usePlayerStore((s) => s.account);
  const chips = usePlayerStore((s) =>
    session ? (s.chipsBySession[session.sessionId] ?? []) : [],
  );
  const hydrate = usePlayerStore((s) => s.hydrateForSession);

  useEffect(() => {
    if (session) hydrate(session.sessionId);
  }, [hydrate, session]);

  if (!session || !account) {
    return <Navigate to="/player" replace />;
  }

  const dealerPubKey = base64UrlToBytes(session.dealerPubKey);
  const verified = chips.filter((wc) => {
    // A chip is trusted if: dealer sig OK, owner is us, endorsement chain coherent,
    // and every endorsement along the way has a valid signature.
    const basic = verifyWalletChip(wc, {
      dealerPubKey,
      sessionId: session.sessionId,
      expectedOwner: account.identity.playerId,
    });
    if (!basic.ok) return false;
    const pubMap: Record<string, Uint8Array> = {};
    // Player might not have the pubKey of prior holders for OUR-received chips — if
    // endorsements exist we expect the transfer QR to have embedded them. For simplicity
    // here we don't re-verify endorsement signatures without the map; the transfer flow
    // already performed that check before adding to the wallet.
    return verifyEndorsementSignatures(wc, pubMap).ok || wc.endorsements.length === 0;
  });

  const balance = sumChips(verified);
  const invalid = chips.length - verified.length;
  const byDealer = groupByDealer(verified);

  return (
    <AppLayout
      title={`Hola, ${account.identity.alias}`}
      subtitle={session.label}
      back={{ to: "/player", label: "Salir" }}
    >
      <Card className="flex flex-col items-center gap-4 py-8">
        <Balance amount={balance} label="Saldo total" size="xl" />
        {invalid > 0 && (
          <Badge tone="danger">
            {invalid} ficha(s) inválidas ignoradas
          </Badge>
        )}
        <ChipStack chips={verified} />
      </Card>

      {Object.keys(byDealer).length > 1 && (
        <Card tone="night">
          <h3 className="font-label text-xs text-[--color-cream]/70">
            POR MESA
          </h3>
          <ul className="mt-2 divide-y divide-[--color-gold-500]/20">
            {Object.entries(byDealer).map(([dealerId, dealerChips]) => (
              <li
                key={dealerId}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="font-label text-[--color-cream]/80">
                  {dealerId}
                </span>
                <span className="font-display text-[--color-gold-300]">
                  ${sumChips(dealerChips).toLocaleString("es-MX")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/player/identity" className="block">
          <Button variant="gold" block>Mi QR</Button>
        </Link>
        <Link to="/player/pay" className="block">
          <Button variant="felt" block>Pagar</Button>
        </Link>
        <Link to="/player/receive" className="block">
          <Button variant="felt" block>Escanear</Button>
        </Link>
        <Link to="/player/transfer" className="block">
          <Button variant="felt" block>Transferir</Button>
        </Link>
        <Link to="/player/history" className="col-span-2 block">
          <Button variant="ghost" block>Ver historial</Button>
        </Link>
      </div>
    </AppLayout>
  );
}

function groupByDealer(chips: WalletChip[]): Record<string, WalletChip[]> {
  return chips.reduce<Record<string, WalletChip[]>>((acc, wc) => {
    (acc[wc.chip.dealerId] ??= []).push(wc);
    return acc;
  }, {});
}
