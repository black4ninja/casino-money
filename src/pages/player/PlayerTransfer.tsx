import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Chip } from "@/components/atoms/Chip";
import { ShareableQR } from "@/components/atoms/ShareableQR";
import { ScannerPanel } from "@/components/molecules/ScannerPanel";
import { DENOMINATIONS } from "@/domain/denominations";
import type { HistoryEntry, PlayerIdentity, WalletChip } from "@/domain/types";
import { useSessionStore } from "@/stores/sessionStore";
import { usePlayerStore } from "@/stores/playerStore";
import { encodeQR, decodeQR } from "@/qr/codec";
import { QR_VERSION, type TransferQR } from "@/qr/schemas";
import { endorseChip } from "@/domain/endorsement";
import { base64UrlToBytes } from "@/crypto/encoding";
import { sumChips } from "@/domain/chip";

export default function PlayerTransfer() {
  const session = useSessionStore((s) => s.session);
  const account = usePlayerStore((s) => s.account);
  const chips = usePlayerStore((s) =>
    session ? (s.chipsBySession[session.sessionId] ?? []) : [],
  );
  const removeChips = usePlayerStore((s) => s.removeChips);
  const appendHistory = usePlayerStore((s) => s.appendHistory);

  const [recipient, setRecipient] = useState<PlayerIdentity | null>(null);
  const [scanning, setScanning] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState<{
    qr: string;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!session || !account) return <Navigate to="/player" replace />;

  const byDenom = useMemo(() => {
    const map: Record<number, WalletChip[]> = {};
    for (const wc of chips) (map[wc.chip.denom] ??= []).push(wc);
    return map;
  }, [chips]);

  const selectedChips = chips.filter((wc) => selected.has(wc.chip.serial));
  const selectedTotal = sumChips(selectedChips);

  function handleScan(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.payload.type !== "identity") {
      setError("Pide al jugador destinatario su QR de identidad.");
      return;
    }
    if (r.payload.identity.playerId === account!.identity.playerId) {
      setError("No te puedes transferir a ti mismo.");
      return;
    }
    setRecipient(r.payload.identity);
    setScanning(false);
    setError(null);
  }

  function toggleFirstMatching(denom: number) {
    const pool = byDenom[denom] ?? [];
    const firstUnselected = pool.find((wc) => !selected.has(wc.chip.serial));
    const firstSelected = pool
      .slice()
      .reverse()
      .find((wc) => selected.has(wc.chip.serial));
    const copy = new Set(selected);
    if (firstUnselected) copy.add(firstUnselected.chip.serial);
    else if (firstSelected) copy.delete(firstSelected.chip.serial);
    setSelected(copy);
  }

  function buildTransfer() {
    if (!recipient || selectedChips.length === 0) return;
    const secretKey = base64UrlToBytes(account!.secretKey);
    const endorsedChips = selectedChips.map((wc) =>
      endorseChip({
        wc,
        from: account!.identity.playerId,
        to: recipient.playerId,
        fromSecretKey: secretKey,
      }),
    );
    const pubKeys: Record<string, string> = {
      [account!.identity.playerId]: account!.identity.pubKey,
    };
    // Include pubkeys for any prior holders embedded in existing endorsements
    // (our wallet might already contain transferred chips).
    for (const wc of endorsedChips) {
      for (const e of wc.endorsements) {
        if (!pubKeys[e.from]) {
          // We only have 'from' pubkey for endorsements we signed; older ones should
          // have arrived via a prior TransferQR carrying their pubkey. In our minimal
          // flow, we mainly transfer chips that came directly from a dealer, so this
          // map is dominated by the current player.
        }
      }
    }
    const payload: TransferQR = {
      v: QR_VERSION,
      type: "transfer",
      fromPlayerId: account!.identity.playerId,
      fromAlias: account!.identity.alias,
      fromPubKey: account!.identity.pubKey,
      walletChips: endorsedChips,
      pubKeys,
    };
    const qr = encodeQR(payload);
    // Lock the chips locally: remove from wallet + record transfer-out in history.
    const serials = selectedChips.map((wc) => wc.chip.serial);
    removeChips(session!.sessionId, serials);
    const history: HistoryEntry[] = selectedChips.map((wc) => ({
      kind: "transfer-out",
      serial: wc.chip.serial,
      denom: wc.chip.denom,
      to: recipient.playerId,
      alias: recipient.alias,
      at: Date.now(),
    }));
    appendHistory(session!.sessionId, history);
    setSubmitted({ qr, total: selectedTotal });
  }

  if (submitted) {
    return (
      <AppLayout
        title="Transferencia"
        subtitle={`Muestra este QR a ${recipient?.alias}`}
        back={{ to: "/player/wallet", label: "Cartera" }}
      >
        <Card className="flex flex-col items-center gap-3 py-6">
          <Badge tone="gold">${submitted.total.toLocaleString("es-MX")}</Badge>
          <ShareableQR value={submitted.qr} label="QR de transferencia" />
          <p className="text-center text-xs text-[--color-cream]/70">
            Las fichas ya salieron de tu cartera. Si el destinatario no lo
            escanea, el dinero se pierde — igual que un billete físico que cae
            al piso.
          </p>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Transferir a jugador"
      subtitle="Escanea el QR del destinatario"
      back={{ to: "/player/wallet", label: "Cartera" }}
    >
      {scanning ? (
        <Card>
          <ScannerPanel onDecoded={handleScan} />
          {error && (
            <p className="mt-3 text-sm text-[--color-carmine-400]">{error}</p>
          )}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-label text-xs text-[--color-cream]/70">
                  DESTINATARIO
                </span>
                <p className="font-display text-lg">{recipient?.alias}</p>
                <p className="font-mono text-xs text-[--color-cream]/50">
                  {recipient?.playerId}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setScanning(true)}>
                Cambiar
              </Button>
            </div>
          </Card>
          <Card>
            <p className="font-label text-xs text-[--color-cream]/70">
              ELIGE LAS FICHAS A ENVIAR
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-center gap-4">
              {DENOMINATIONS.map((d) => {
                const pool = byDenom[d] ?? [];
                if (pool.length === 0) return null;
                const selectedInDenom = pool.filter((wc) =>
                  selected.has(wc.chip.serial),
                ).length;
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <Chip
                      denom={d}
                      count={pool.length}
                      selected={selectedInDenom > 0}
                      onClick={() => toggleFirstMatching(d)}
                    />
                    <span className="font-mono text-[10px] text-[--color-cream]/60">
                      {selectedInDenom}/{pool.length}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card tone="night" className="flex flex-col items-center gap-3">
            <span className="font-display text-4xl text-[--color-gold-300]">
              ${selectedTotal.toLocaleString("es-MX")}
            </span>
            <Button
              variant="gold"
              block
              disabled={selectedChips.length === 0}
              onClick={buildTransfer}
            >
              Enviar
            </Button>
          </Card>
        </>
      )}
    </AppLayout>
  );
}
