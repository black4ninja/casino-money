import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ScannerPanel } from "@/components/organisms/ScannerPanel";
import { ShareableQR } from "@/components/molecules/ShareableQR";
import { decodeQR, encodeQR } from "@/qr/codec";
import { QR_VERSION, type ReceiptQR } from "@/qr/schemas";
import { verifyForRedeem } from "@/domain/chip";
import {
  verifyEndorsementSignatures,
  verifyEndorsementChain,
} from "@/domain/endorsement";
import { base64UrlToBytes } from "@/crypto/encoding";
import { useSessionStore } from "@/stores/sessionStore";
import { useDealerStore } from "@/stores/dealerStore";
import { isSpent } from "@/storage/dealer";
import type { RedeemedRecord, WalletChip } from "@/domain/types";

export default function DealerRedeem() {
  const session = useSessionStore((s) => s.session);
  const keypair = useDealerStore((s) => s.keypair);
  const dealerId = useDealerStore((s) => s.dealerId);
  const ledger = useDealerStore((s) => s.ledger);
  const addRedeemed = useDealerStore((s) => s.addRedeemed);

  const [result, setResult] = useState<
    | { kind: "scanning" }
    | {
        kind: "accepted";
        total: number;
        serials: string[];
        receiptQR: string;
      }
    | { kind: "rejected"; reasons: string[] }
  >({ kind: "scanning" });

  if (!session || !keypair || !dealerId || !ledger) {
    return <Navigate to="/dealer" replace />;
  }

  const dealerPubKey = base64UrlToBytes(session.dealerPubKey);

  function handle(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setResult({ kind: "rejected", reasons: [r.error] });
      return;
    }
    if (r.payload.type !== "redeem") {
      setResult({
        kind: "rejected",
        reasons: ["El QR no es un pago de jugador."],
      });
      return;
    }

    const pubMap: Record<string, Uint8Array> = {};
    for (const [pid, b64] of Object.entries(r.payload.pubKeys ?? {})) {
      pubMap[pid] = base64UrlToBytes(b64);
    }

    const acceptedRecords: RedeemedRecord[] = [];
    const acceptedSerials: string[] = [];
    const rejections: string[] = [];
    let total = 0;
    const seen = new Set<string>();

    for (const wc of r.payload.walletChips) {
      const v = verifyForRedeem(wc, {
        dealerPubKey,
        sessionId: session!.sessionId,
        myDealerId: dealerId!,
      });
      if (!v.ok) {
        rejections.push(`${wc.chip.serial.slice(0, 8)}: ${reasonLabel(v.reason)}`);
        continue;
      }
      if (isSpent(ledger!, wc.chip.serial)) {
        rejections.push(`${wc.chip.serial.slice(0, 8)}: ya cobrada antes`);
        continue;
      }
      if (seen.has(wc.chip.serial)) {
        rejections.push(`${wc.chip.serial.slice(0, 8)}: duplicada en el mismo QR`);
        continue;
      }
      seen.add(wc.chip.serial);
      const chainSigs = verifyEndorsementSignatures(wc, pubMap);
      const chain = verifyEndorsementChain(wc);
      if (!chain.ok || !chainSigs.ok) {
        rejections.push(
          `${wc.chip.serial.slice(0, 8)}: cadena de endosos inválida`,
        );
        continue;
      }
      total += wc.chip.denom;
      acceptedSerials.push(wc.chip.serial);
      acceptedRecords.push({
        serial: wc.chip.serial,
        denom: wc.chip.denom,
        fromPlayer: currentHolder(wc),
        at: Date.now(),
        hops: wc.endorsements.length,
      });
    }

    if (acceptedRecords.length === 0) {
      setResult({ kind: "rejected", reasons: rejections });
      return;
    }
    addRedeemed(acceptedRecords);
    const receipt: ReceiptQR = {
      v: QR_VERSION,
      type: "receipt",
      sessionId: session!.sessionId,
      dealerId: dealerId!,
      spentSerials: acceptedSerials,
      at: Date.now(),
    };
    setResult({
      kind: "accepted",
      total,
      serials: acceptedSerials,
      receiptQR: encodeQR(receipt),
    });
  }

  return (
    <AppLayout
      title="Cobrar apuesta"
      subtitle={dealerId}
      back={{ to: "/dealer/menu", label: "Mesa" }}
    >
      {result.kind === "scanning" && (
        <Card>
          <p className="font-label text-xs text-[--color-cream]/70">
            ESCANEA EL QR DE PAGO DEL JUGADOR
          </p>
          <div className="mt-3">
            <ScannerPanel onDecoded={handle} />
          </div>
        </Card>
      )}

      {result.kind === "accepted" && (
        <Card className="flex flex-col items-center gap-3 py-6">
          <Badge tone="gold">ACEPTADO</Badge>
          <span className="font-display text-5xl text-[--color-gold-300]">
            ${result.total.toLocaleString("es-MX")}
          </span>
          <p className="text-sm">{result.serials.length} ficha(s) cobradas</p>
          <ShareableQR value={result.receiptQR} label="Muestra el recibo al jugador" />
          <Button variant="danger" onClick={() => setResult({ kind: "scanning" })}>
            Cobrar otra apuesta
          </Button>
        </Card>
      )}

      {result.kind === "rejected" && (
        <Card>
          <Badge tone="danger">RECHAZADO</Badge>
          <ul className="mt-3 space-y-1 text-sm">
            {result.reasons.map((r, i) => (
              <li key={i} className="text-[--color-carmine-400]">
                · {r}
              </li>
            ))}
          </ul>
          <Button
            className="mt-4"
            variant="felt"
            onClick={() => setResult({ kind: "scanning" })}
          >
            Intentar de nuevo
          </Button>
        </Card>
      )}
    </AppLayout>
  );
}

function currentHolder(wc: WalletChip): string {
  return wc.endorsements.length > 0
    ? wc.endorsements[wc.endorsements.length - 1].to
    : wc.chip.issuedTo;
}

function reasonLabel(reason: string): string {
  switch (reason) {
    case "bad-dealer-signature":
      return "firma del dealer inválida";
    case "wrong-session":
      return "otra sesión";
    case "wrong-dealer-for-redeem":
      return "ficha de otra mesa";
    case "broken-endorsement-chain":
      return "cadena de endosos rota";
    case "bad-endorsement-signature":
      return "firma de endoso inválida";
    case "not-owned-by-player":
      return "no te pertenece";
    case "already-spent":
      return "ya cobrada";
    default:
      return reason;
  }
}
