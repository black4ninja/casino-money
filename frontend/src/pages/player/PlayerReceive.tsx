import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ScannerPanel } from "@/components/organisms/ScannerPanel";
import { decodeQR } from "@/qr/codec";
import { base64UrlToBytes } from "@/crypto/encoding";
import { verifyChipSignature, verifyWalletChip } from "@/domain/chip";
import { verifyEndorsementSignatures } from "@/domain/endorsement";
import type { HistoryEntry, WalletChip } from "@/domain/types";
import { useSessionStore } from "@/stores/sessionStore";
import { usePlayerStore } from "@/stores/playerStore";

export default function PlayerReceive() {
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const account = usePlayerStore((s) => s.account);
  const addChips = usePlayerStore((s) => s.addChips);
  const appendHistory = usePlayerStore((s) => s.appendHistory);

  const [status, setStatus] = useState<
    { kind: "scanning" } | { kind: "ok"; message: string } | { kind: "error"; message: string }
  >({ kind: "scanning" });

  if (!session || !account) return <Navigate to="/player" replace />;
  const dealerPubKey = base64UrlToBytes(session.dealerPubKey);

  function handle(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setStatus({ kind: "error", message: r.error });
      return;
    }

    if (r.payload.type === "chips") {
      const p = r.payload;
      if (p.sessionId !== session!.sessionId) {
        setStatus({ kind: "error", message: "Fichas de otra sesión." });
        return;
      }
      if (p.toPlayerId !== account!.identity.playerId) {
        setStatus({
          kind: "error",
          message: "Estas fichas fueron firmadas para otro jugador.",
        });
        return;
      }
      const invalid = p.chips.filter(
        (c) => !verifyChipSignature(c, dealerPubKey),
      );
      if (invalid.length > 0) {
        setStatus({
          kind: "error",
          message: `${invalid.length} ficha(s) con firma inválida — rechazadas.`,
        });
        return;
      }
      const wcs: WalletChip[] = p.chips.map((chip) => ({
        chip,
        endorsements: [],
      }));
      addChips(session!.sessionId, wcs);
      const history: HistoryEntry[] = wcs.map((wc) => ({
        kind: "receive",
        serial: wc.chip.serial,
        denom: wc.chip.denom,
        from: wc.chip.dealerId,
        at: Date.now(),
      }));
      appendHistory(session!.sessionId, history);
      const total = wcs.reduce((a, wc) => a + wc.chip.denom, 0);
      setStatus({
        kind: "ok",
        message: `Recibiste $${total.toLocaleString("es-MX")} en ${wcs.length} ficha(s) de ${p.dealerId}`,
      });
      return;
    }

    if (r.payload.type === "transfer") {
      const p = r.payload;
      // Build pubkey map from embedded pubKeys.
      const pubMap: Record<string, Uint8Array> = {};
      for (const [pid, b64] of Object.entries(p.pubKeys)) {
        pubMap[pid] = base64UrlToBytes(b64);
      }
      const acceptable: WalletChip[] = [];
      const rejected: string[] = [];
      for (const wc of p.walletChips) {
        const basic = verifyWalletChip(wc, {
          dealerPubKey,
          sessionId: session!.sessionId,
          expectedOwner: account!.identity.playerId,
        });
        if (!basic.ok) {
          rejected.push(`${wc.chip.serial.slice(0, 8)}: ${basic.reason}`);
          continue;
        }
        const sigs = verifyEndorsementSignatures(wc, pubMap);
        if (!sigs.ok) {
          rejected.push(`${wc.chip.serial.slice(0, 8)}: ${sigs.reason}`);
          continue;
        }
        acceptable.push(wc);
      }
      if (acceptable.length > 0) {
        addChips(session!.sessionId, acceptable);
        const history: HistoryEntry[] = acceptable.map((wc) => ({
          kind: "transfer-in",
          serial: wc.chip.serial,
          denom: wc.chip.denom,
          from: p.fromPlayerId,
          alias: p.fromAlias,
          at: Date.now(),
        }));
        appendHistory(session!.sessionId, history);
      }
      const total = acceptable.reduce((a, wc) => a + wc.chip.denom, 0);
      if (rejected.length === 0) {
        setStatus({
          kind: "ok",
          message: `Recibiste $${total.toLocaleString("es-MX")} de ${p.fromAlias}`,
        });
      } else {
        setStatus({
          kind: "error",
          message: `Aceptadas $${total.toLocaleString("es-MX")}. Rechazadas: ${rejected.length}.`,
        });
      }
      return;
    }

    setStatus({
      kind: "error",
      message: "Este QR no es una entrega de fichas ni una transferencia.",
    });
  }

  return (
    <AppLayout
      title="Recibir fichas"
      subtitle="Escanea el QR del dealer o de otro jugador"
      back={{ to: "/player/wallet", label: "Cartera" }}
    >
      {status.kind === "scanning" && <ScannerPanel onDecoded={handle} />}

      {status.kind === "ok" && (
        <Card>
          <Badge tone="gold">ÉXITO</Badge>
          <p className="mt-3 text-[--color-cream]">{status.message}</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="felt"
              onClick={() => setStatus({ kind: "scanning" })}
            >
              Escanear otro
            </Button>
            <Button variant="gold" onClick={() => navigate("/player/wallet")}>
              Ver cartera
            </Button>
          </div>
        </Card>
      )}

      {status.kind === "error" && (
        <Card>
          <Badge tone="danger">ERROR</Badge>
          <p className="mt-3 text-[--color-cream]">{status.message}</p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="felt"
              onClick={() => setStatus({ kind: "scanning" })}
            >
              Intentar de nuevo
            </Button>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}
