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
import type { HistoryEntry, WalletChip } from "@/domain/types";
import { useSessionStore } from "@/stores/sessionStore";
import { usePlayerStore } from "@/stores/playerStore";
import { encodeQR, decodeQR } from "@/qr/codec";
import { QR_VERSION, type RedeemQR } from "@/qr/schemas";
import { sumChips } from "@/domain/chip";

export default function PlayerPay() {
  const session = useSessionStore((s) => s.session);
  const account = usePlayerStore((s) => s.account);
  const chips = usePlayerStore((s) =>
    session ? (s.chipsBySession[session.sessionId] ?? []) : [],
  );
  const removeChips = usePlayerStore((s) => s.removeChips);
  const appendHistory = usePlayerStore((s) => s.appendHistory);

  const [selectedDealer, setSelectedDealer] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState<{
    qr: string;
    total: number;
    serials: string[];
    dealerId: string;
  } | null>(null);
  const [confirmScan, setConfirmScan] = useState(false);

  if (!session || !account) return <Navigate to="/player" replace />;

  const byDealer = useMemo(() => {
    return chips.reduce<Record<string, WalletChip[]>>((acc, wc) => {
      (acc[wc.chip.dealerId] ??= []).push(wc);
      return acc;
    }, {});
  }, [chips]);

  if (submitted) {
    return (
      <AppLayout
        title="Pagar a mesa"
        subtitle={`Muestra el QR al tallador de ${submitted.dealerId}`}
        back={{ to: "/player/wallet", label: "Cartera" }}
      >
        <Card className="flex flex-col items-center gap-3 py-6">
          <Badge tone="gold">
            ${submitted.total.toLocaleString("es-MX")} — {submitted.dealerId}
          </Badge>
          <ShareableQR value={submitted.qr} label="QR de pago" />
          <p className="text-center text-xs text-[--color-cream]/70">
            Cuando el tallador te devuelva el QR de confirmación, escanéalo aquí
            para marcar las fichas como gastadas.
          </p>
        </Card>
        <Card tone="night">
          {confirmScan ? (
            <div className="flex flex-col gap-3">
              <ScannerPanel
                onDecoded={(text) => {
                  const r = decodeQR(text);
                  if (!r.ok || r.payload.type !== "receipt") {
                    alert("No es un recibo válido del tallador.");
                    return;
                  }
                  if (r.payload.dealerId !== submitted.dealerId) {
                    alert("Recibo de otra mesa.");
                    return;
                  }
                  const confirmed = submitted.serials.filter((s) =>
                    r.payload.type === "receipt" &&
                    r.payload.spentSerials.includes(s),
                  );
                  removeChips(session.sessionId, confirmed);
                  const history: HistoryEntry[] = [];
                  for (const serial of confirmed) {
                    const wc = chips.find((c) => c.chip.serial === serial);
                    if (!wc) continue;
                    history.push({
                      kind: "redeem",
                      serial,
                      denom: wc.chip.denom,
                      to: submitted.dealerId,
                      at: Date.now(),
                    });
                  }
                  appendHistory(session.sessionId, history);
                  setSubmitted(null);
                  setSelected(new Set());
                  setConfirmScan(false);
                }}
              />
              <Button variant="ghost" onClick={() => setConfirmScan(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="felt" block onClick={() => setConfirmScan(true)}>
                Escanear recibo
              </Button>
              <Button variant="ghost" onClick={() => setSubmitted(null)}>
                Cancelar pago
              </Button>
            </div>
          )}
        </Card>
      </AppLayout>
    );
  }

  if (!selectedDealer) {
    const dealers = Object.keys(byDealer);
    return (
      <AppLayout
        title="Pagar"
        subtitle="Elige la mesa donde vas a pagar"
        back={{ to: "/player/wallet", label: "Cartera" }}
      >
        {dealers.length === 0 ? (
          <Card>
            <p className="text-sm">No tienes fichas para pagar todavía.</p>
          </Card>
        ) : (
          dealers.map((d) => {
            const dealerChips = byDealer[d];
            return (
              <Card
                key={d}
                onClick={() => setSelectedDealer(d)}
                className="cursor-pointer hover:border-[--color-gold-400]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg">{d}</span>
                  <span className="font-display text-xl text-[--color-gold-300]">
                    ${sumChips(dealerChips).toLocaleString("es-MX")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[--color-cream]/60">
                  {dealerChips.length} ficha(s) disponibles
                </p>
              </Card>
            );
          })
        )}
      </AppLayout>
    );
  }

  const dealerChips = byDealer[selectedDealer] ?? [];
  const byDenom: Record<number, WalletChip[]> = {};
  for (const wc of dealerChips) {
    (byDenom[wc.chip.denom] ??= []).push(wc);
  }

  const selectedChips = dealerChips.filter((wc) => selected.has(wc.chip.serial));
  const selectedTotal = sumChips(selectedChips);

  function toggleFirstMatching(denom: number) {
    const pool = byDenom[denom] ?? [];
    const firstUnselected = pool.find((wc) => !selected.has(wc.chip.serial));
    const firstSelected = pool
      .slice()
      .reverse()
      .find((wc) => selected.has(wc.chip.serial));
    const copy = new Set(selected);
    if (firstUnselected) {
      copy.add(firstUnselected.chip.serial);
    } else if (firstSelected) {
      copy.delete(firstSelected.chip.serial);
    }
    setSelected(copy);
  }

  function buildPayment() {
    if (selectedChips.length === 0) return;
    const payload: RedeemQR = {
      v: QR_VERSION,
      type: "redeem",
      walletChips: selectedChips,
      pubKeys: {}, // chain sin endosos aquí, receptor no necesita pubkeys extra
    };
    const qr = encodeQR(payload);
    setSubmitted({
      qr,
      total: selectedTotal,
      serials: selectedChips.map((wc) => wc.chip.serial),
      dealerId: selectedDealer!,
    });
  }

  return (
    <AppLayout
      title="Pagar"
      subtitle={`Mesa: ${selectedDealer}`}
      back={{ to: "/player/pay", label: "Cambiar mesa" }}
    >
      <Card>
        <p className="font-label text-xs text-[--color-cream]/70">TOCA UNA FICHA PARA SUMARLA</p>
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
        <span className="font-label text-xs text-[--color-cream]/70">TOTAL</span>
        <span className="font-display text-4xl text-[--color-gold-300]">
          ${selectedTotal.toLocaleString("es-MX")}
        </span>
        <Button
          variant="gold"
          block
          onClick={buildPayment}
          disabled={selectedChips.length === 0}
        >
          Generar QR de pago
        </Button>
        {selectedChips.length > 0 && (
          <Button variant="ghost" onClick={() => setSelected(new Set())}>
            Limpiar selección
          </Button>
        )}
      </Card>
    </AppLayout>
  );
}
