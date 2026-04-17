import { useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Chip } from "@/components/atoms/Chip";
import { QRCanvas } from "@/components/atoms/QRCanvas";
import { QRScanner } from "@/components/molecules/QRScanner";
import { DENOMINATIONS, type Denomination } from "@/domain/denominations";
import type { Chip as ChipType, PlayerIdentity } from "@/domain/types";
import { useSessionStore } from "@/stores/sessionStore";
import { useDealerStore } from "@/stores/dealerStore";
import { decodeQR, encodeQR } from "@/qr/codec";
import { QR_VERSION, type ChipsQR } from "@/qr/schemas";
import { issueChip } from "@/domain/chip";

export default function DealerEmit() {
  const session = useSessionStore((s) => s.session);
  const keypair = useDealerStore((s) => s.keypair);
  const dealerId = useDealerStore((s) => s.dealerId);
  const addIssued = useDealerStore((s) => s.addIssued);

  const [recipient, setRecipient] = useState<PlayerIdentity | null>(null);
  const [counts, setCounts] = useState<Record<Denomination, number>>(
    emptyCounts(),
  );
  const [emitted, setEmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session || !keypair || !dealerId) {
    return <Navigate to="/dealer" replace />;
  }

  const total = DENOMINATIONS.reduce(
    (acc, d) => acc + (counts[d] ?? 0) * d,
    0,
  );
  const nChips = DENOMINATIONS.reduce((acc, d) => acc + (counts[d] ?? 0), 0);

  function handleScan(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.payload.type !== "identity") {
      setError("Pide al jugador su QR de identidad.");
      return;
    }
    setRecipient(r.payload.identity);
    setError(null);
  }

  function adjust(denom: Denomination, delta: number) {
    setCounts((prev) => ({
      ...prev,
      [denom]: Math.max(0, (prev[denom] ?? 0) + delta),
    }));
  }

  function issue() {
    if (!recipient || nChips === 0) return;
    const chips: ChipType[] = [];
    for (const d of DENOMINATIONS) {
      for (let i = 0; i < (counts[d] ?? 0); i++) {
        chips.push(
          issueChip({
            denom: d,
            sessionId: session!.sessionId,
            dealerId: dealerId!,
            issuedTo: recipient.playerId,
            dealerSecretKey: keypair!.secretKey,
          }),
        );
      }
    }
    const payload: ChipsQR = {
      v: QR_VERSION,
      type: "chips",
      sessionId: session!.sessionId,
      dealerId: dealerId!,
      toPlayerId: recipient.playerId,
      chips,
    };
    const qr = encodeQR(payload);
    addIssued(
      chips.map((c) => ({
        serial: c.serial,
        denom: c.denom,
        issuedTo: recipient!.playerId,
        alias: recipient!.alias,
        at: c.issuedAt,
      })),
    );
    setEmitted(qr);
  }

  function reset() {
    setRecipient(null);
    setCounts(emptyCounts());
    setEmitted(null);
    setError(null);
  }

  if (emitted && recipient) {
    return (
      <AppLayout
        title="Fichas emitidas"
        subtitle={`Para ${recipient.alias}`}
        back={{ to: "/dealer/menu", label: "Mesa" }}
      >
        <Card className="flex flex-col items-center gap-3 py-6">
          <Badge tone="gold">${total.toLocaleString("es-MX")}</Badge>
          <QRCanvas value={emitted} label="QR para el jugador" />
          <p className="text-center text-xs text-[--color-cream]/70">
            El jugador debe escanear este QR para recibir las fichas. Las fichas
            quedan atadas a esta mesa ({dealerId}).
          </p>
          <Button variant="gold" onClick={reset}>
            Emitir más
          </Button>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Emitir fichas"
      subtitle={dealerId}
      back={{ to: "/dealer/menu", label: "Mesa" }}
    >
      {!recipient ? (
        <Card>
          <p className="font-label text-xs text-[--color-cream]/70">
            ESCANEA EL QR DE IDENTIDAD DEL JUGADOR
          </p>
          <div className="mt-3">
            <QRScanner onDecoded={handleScan} />
          </div>
          {error && (
            <p className="mt-3 text-sm text-[--color-carmine-400]">{error}</p>
          )}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label text-xs text-[--color-cream]/70">
                  DESTINATARIO
                </p>
                <p className="font-display text-lg">{recipient.alias}</p>
                <p className="font-mono text-xs text-[--color-cream]/50">
                  {recipient.playerId}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setRecipient(null)}>
                Cambiar
              </Button>
            </div>
          </Card>
          <Card>
            <p className="font-label text-xs text-[--color-cream]/70">
              TOCA +/- PARA CADA DENOMINACIÓN
            </p>
            <div className="mt-4 flex flex-col gap-4">
              {DENOMINATIONS.map((d) => (
                <div
                  key={d}
                  className="flex items-center justify-between gap-3"
                >
                  <Chip denom={d} size={60} />
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="ghost" onClick={() => adjust(d, -1)}>
                      −
                    </Button>
                    <span className="font-display w-10 text-center text-2xl text-[--color-gold-300]">
                      {counts[d] ?? 0}
                    </span>
                    <Button size="sm" variant="gold" onClick={() => adjust(d, +1)}>
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card tone="night" className="flex flex-col items-center gap-3">
            <span className="font-display text-4xl text-[--color-gold-300]">
              ${total.toLocaleString("es-MX")}
            </span>
            <Button
              variant="gold"
              block
              onClick={issue}
              disabled={nChips === 0}
            >
              Firmar y generar QR
            </Button>
          </Card>
        </>
      )}
    </AppLayout>
  );
}

function emptyCounts(): Record<Denomination, number> {
  return DENOMINATIONS.reduce(
    (acc, d) => {
      acc[d] = 0;
      return acc;
    },
    {} as Record<Denomination, number>,
  );
}
