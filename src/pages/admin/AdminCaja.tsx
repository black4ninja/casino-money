import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { Chip } from "@/components/atoms/Chip";
import { ShareableQR } from "@/components/atoms/ShareableQR";
import { ScannerPanel } from "@/components/molecules/ScannerPanel";
import { deriveKeypairFromPassword, isPasswordAcceptable } from "@/crypto/keys";
import { bytesToBase64Url } from "@/crypto/encoding";
import { encodeQR, decodeQR } from "@/qr/codec";
import { QR_VERSION, type ChipsQR } from "@/qr/schemas";
import { issueChip } from "@/domain/chip";
import type { Chip as ChipType, PlayerIdentity } from "@/domain/types";
import { DENOMINATIONS } from "@/domain/denominations";
import {
  composeWelcome,
  compositionCount,
  compositionTotal,
  emptyComposition,
  type Composition,
} from "@/domain/composition";
import { useSessionStore } from "@/stores/sessionStore";
import type { Keypair } from "@/crypto/signatures";

/**
 * Admin-only "cashier" flow. The maestro can use this to distribute the welcome
 * bundle (initial balance) to any player, or to emit ad-hoc grants to a specific
 * mesa. Reuses the dealer signature logic because the cashier IS a dealer whose
 * mesaId rotates across the declared mesas when distributing the welcome pack.
 */
export default function AdminCaja() {
  const session = useSessionStore((s) => s.session);

  const [password, setPassword] = useState("");
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [recipient, setRecipient] = useState<PlayerIdentity | null>(null);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "error"; message: string }
    | { kind: "granted"; summary: string; qr: string }
  >({ kind: "idle" });
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState<"welcome" | "custom">("welcome");
  const [customMesa, setCustomMesa] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("200");
  const [customCounts, setCustomCounts] = useState<Composition>(emptyComposition());
  const [customUsesAuto, setCustomUsesAuto] = useState(true);

  if (!session) return <Navigate to="/admin" replace />;

  const declaredMesas = session.mesas ?? [];
  const initialPerMesa = session.initialPerMesa ?? 500;
  const totalInitialPerPlayer = initialPerMesa * Math.max(declaredMesas.length, 1);

  async function unlock() {
    setStatus({ kind: "idle" });
    if (!isPasswordAcceptable(password)) {
      setStatus({ kind: "error", message: "Contraseña demasiado corta." });
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const kp = deriveKeypairFromPassword(password, session!.salt);
      if (bytesToBase64Url(kp.publicKey) !== session!.dealerPubKey) {
        setStatus({ kind: "error", message: "Contraseña incorrecta." });
        return;
      }
      setKeypair(kp);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  function handlePlayerScan(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setStatus({ kind: "error", message: r.error });
      return;
    }
    if (r.payload.type !== "identity") {
      setStatus({
        kind: "error",
        message: "Pide al jugador su QR de identidad.",
      });
      return;
    }
    setRecipient(r.payload.identity);
    setStatus({ kind: "idle" });
  }

  function grantWelcome() {
    if (!keypair || !recipient) return;
    if (declaredMesas.length === 0) {
      setStatus({
        kind: "error",
        message:
          "No hay mesas declaradas. Vuelve a crear la sesión con los nombres de mesa.",
      });
      return;
    }
    const composition = composeWelcome(initialPerMesa);
    if (compositionTotal(composition) === 0) {
      setStatus({ kind: "error", message: "El saldo inicial es $0." });
      return;
    }
    const allChips: ChipType[] = [];
    for (const mesaId of declaredMesas) {
      for (const d of DENOMINATIONS) {
        for (let i = 0; i < composition[d]; i++) {
          allChips.push(
            issueChip({
              denom: d,
              sessionId: session!.sessionId,
              dealerId: mesaId,
              issuedTo: recipient!.playerId,
              dealerSecretKey: keypair!.secretKey,
            }),
          );
        }
      }
    }
    const payload: ChipsQR = {
      v: QR_VERSION,
      type: "chips",
      sessionId: session!.sessionId,
      dealerId: "Caja",
      toPlayerId: recipient!.playerId,
      chips: allChips,
    };
    const qr = encodeQR(payload);
    setStatus({
      kind: "granted",
      summary: `Saldo inicial entregado a ${recipient!.alias}: $${(initialPerMesa * declaredMesas.length).toLocaleString("es-MX")} (${compositionCount(composition) * declaredMesas.length} fichas distribuidas en ${declaredMesas.length} mesas).`,
      qr,
    });
  }

  function grantCustom() {
    if (!keypair || !recipient) return;
    const mesa = customMesa.trim();
    if (!mesa) {
      setStatus({ kind: "error", message: "Elige una mesa." });
      return;
    }
    const counts = customUsesAuto
      ? composeWelcome(Math.max(0, Math.floor(Number(customAmount) || 0)))
      : customCounts;
    if (compositionTotal(counts) === 0) {
      setStatus({ kind: "error", message: "La cantidad debe ser mayor a $0." });
      return;
    }
    const chips: ChipType[] = [];
    for (const d of DENOMINATIONS) {
      for (let i = 0; i < counts[d]; i++) {
        chips.push(
          issueChip({
            denom: d,
            sessionId: session!.sessionId,
            dealerId: mesa,
            issuedTo: recipient!.playerId,
            dealerSecretKey: keypair!.secretKey,
          }),
        );
      }
    }
    const payload: ChipsQR = {
      v: QR_VERSION,
      type: "chips",
      sessionId: session!.sessionId,
      dealerId: "Caja",
      toPlayerId: recipient!.playerId,
      chips,
    };
    setStatus({
      kind: "granted",
      summary: `Entregado a ${recipient!.alias}: $${compositionTotal(counts).toLocaleString("es-MX")} para ${mesa} (${compositionCount(counts)} fichas).`,
      qr: encodeQR(payload),
    });
  }

  function reset() {
    setRecipient(null);
    setStatus({ kind: "idle" });
    setCustomCounts(emptyComposition());
    setCustomUsesAuto(true);
  }

  const customAutoComposition = useMemo(
    () => composeWelcome(Math.max(0, Math.floor(Number(customAmount) || 0))),
    [customAmount],
  );

  if (!keypair) {
    return (
      <AppLayout
        title="Caja del maestro"
        subtitle="Ingresa la contraseña para desbloquear la caja"
        back={{ to: "/admin", label: "Admin" }}
      >
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-[--color-cream]/80">
            La Caja te permite firmar fichas en nombre del casino. Usa la misma
            contraseña maestra con la que creaste la sesión.
          </p>
          <Input
            label="Contraseña maestra"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {status.kind === "error" && (
            <p className="text-sm text-[--color-carmine-400]">{status.message}</p>
          )}
          <Button variant="gold" block onClick={unlock} disabled={busy}>
            {busy ? "Verificando…" : "Desbloquear Caja"}
          </Button>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Caja del maestro"
      subtitle={session.label}
      back={{ to: "/admin", label: "Admin" }}
    >
      {status.kind === "granted" ? (
        <Card className="flex flex-col items-center gap-3 py-6">
          <Badge tone="gold">ENTREGADO</Badge>
          <p className="text-center text-sm text-[--color-cream]">
            {status.summary}
          </p>
          <ShareableQR
            value={status.qr}
            label="Comparte con el jugador"
            shareTitle="Casino Money — saldo inicial"
          />
          <p className="text-center text-xs text-[--color-cream]/70">
            Pasa este QR/enlace al jugador para que agregue las fichas a su
            cartera.
          </p>
          <div className="flex gap-2">
            <Button variant="gold" onClick={reset}>
              Otorgar a otro jugador
            </Button>
          </div>
        </Card>
      ) : !recipient ? (
        <Card>
          <p className="font-label text-xs text-[--color-cream]/70">
            ESCANEA O PEGA EL QR DE IDENTIDAD DEL JUGADOR
          </p>
          <div className="mt-3">
            <ScannerPanel onDecoded={handlePlayerScan} />
          </div>
          {status.kind === "error" && (
            <p className="mt-3 text-sm text-[--color-carmine-400]">
              {status.message}
            </p>
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

          <div className="flex gap-2">
            <ModeTab
              active={mode === "welcome"}
              onClick={() => setMode("welcome")}
            >
              Saldo inicial
            </ModeTab>
            <ModeTab
              active={mode === "custom"}
              onClick={() => setMode("custom")}
            >
              Entrega custom
            </ModeTab>
          </div>

          {mode === "welcome" && (
            <Card className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge tone="gold">SALDO INICIAL</Badge>
                <span className="font-display text-3xl text-[--color-gold-300]">
                  ${totalInitialPerPlayer.toLocaleString("es-MX")}
                </span>
              </div>
              {declaredMesas.length > 0 ? (
                <>
                  <p className="text-sm text-[--color-cream]/80">
                    Se firma un bundle de{" "}
                    <strong>${initialPerMesa.toLocaleString("es-MX")}</strong>{" "}
                    para cada una de las {declaredMesas.length} mesas
                    declaradas. El jugador podrá usar las fichas en cualquiera
                    de ellas.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {declaredMesas.map((m) => (
                      <Badge key={m} tone="felt">
                        {m}
                      </Badge>
                    ))}
                  </div>
                  <CompositionView
                    composition={composeWelcome(initialPerMesa)}
                    label={`Composición por mesa (×${declaredMesas.length})`}
                  />
                  {status.kind === "error" && (
                    <p className="text-sm text-[--color-carmine-400]">
                      {status.message}
                    </p>
                  )}
                  <Button variant="gold" block onClick={grantWelcome}>
                    Firmar y entregar ${totalInitialPerPlayer}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-[--color-carmine-400]">
                  La sesión no tiene mesas declaradas. Vuelve al panel de
                  sesión y agrégalas.
                </p>
              )}
            </Card>
          )}

          {mode === "custom" && (
            <Card className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-label text-xs text-[--color-cream]/70">
                  MESA
                </span>
                {declaredMesas.length > 0 ? (
                  <select
                    value={customMesa}
                    onChange={(e) => setCustomMesa(e.target.value)}
                    className="rounded-xl border border-[--color-gold-500]/40 bg-[--color-smoke-800]/60 px-4 py-3 text-[--color-ivory]"
                  >
                    <option value="">— elegir mesa —</option>
                    {declaredMesas.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={customMesa}
                    onChange={(e) => setCustomMesa(e.target.value)}
                    placeholder="Mesa-1"
                    className="rounded-xl border border-[--color-gold-500]/40 bg-[--color-smoke-800]/60 px-4 py-3 text-[--color-ivory]"
                  />
                )}
              </label>

              <div className="flex gap-2">
                <button
                  onClick={() => setCustomUsesAuto(true)}
                  className={[
                    "flex-1 rounded-full border px-3 py-1 font-label text-xs tracking-widest",
                    customUsesAuto
                      ? "border-[--color-gold-500] bg-[--color-gold-500]/20 text-[--color-gold-300]"
                      : "border-[--color-cream]/20 text-[--color-cream]/60",
                  ].join(" ")}
                >
                  Por cantidad
                </button>
                <button
                  onClick={() => setCustomUsesAuto(false)}
                  className={[
                    "flex-1 rounded-full border px-3 py-1 font-label text-xs tracking-widest",
                    !customUsesAuto
                      ? "border-[--color-gold-500] bg-[--color-gold-500]/20 text-[--color-gold-300]"
                      : "border-[--color-cream]/20 text-[--color-cream]/60",
                  ].join(" ")}
                >
                  Por fichas
                </button>
              </div>

              {customUsesAuto ? (
                <>
                  <Input
                    label="Cantidad a entregar"
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="200"
                  />
                  <CompositionView
                    composition={customAutoComposition}
                    label="Composición sugerida"
                  />
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  {DENOMINATIONS.map((d) => (
                    <div
                      key={d}
                      className="flex items-center justify-between gap-3"
                    >
                      <Chip denom={d} size={48} />
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setCustomCounts((p) => ({
                              ...p,
                              [d]: Math.max(0, p[d] - 1),
                            }))
                          }
                        >
                          −
                        </Button>
                        <span className="w-8 text-center font-display text-lg text-[--color-gold-300]">
                          {customCounts[d]}
                        </span>
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={() =>
                            setCustomCounts((p) => ({ ...p, [d]: p[d] + 1 }))
                          }
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-right font-display text-xl text-[--color-gold-300]">
                    Total: ${compositionTotal(customCounts).toLocaleString("es-MX")}
                  </p>
                </div>
              )}

              {status.kind === "error" && (
                <p className="text-sm text-[--color-carmine-400]">
                  {status.message}
                </p>
              )}
              <Button variant="gold" block onClick={grantCustom}>
                Firmar y entregar
              </Button>
            </Card>
          )}
        </>
      )}
    </AppLayout>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex-1 rounded-full border px-4 py-2 font-label text-xs tracking-widest transition",
        active
          ? "border-[--color-gold-500] bg-[--color-gold-500]/20 text-[--color-gold-300]"
          : "border-[--color-cream]/20 bg-transparent text-[--color-cream]/60 hover:bg-white/5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function CompositionView({
  composition,
  label,
}: {
  composition: Composition;
  label: string;
}) {
  const anyChips = compositionCount(composition) > 0;
  if (!anyChips) {
    return (
      <p className="text-xs text-[--color-cream]/60">{label}: sin fichas</p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-[--color-smoke-800]/60 p-3">
      <p className="font-label text-xs text-[--color-cream]/70">{label}</p>
      <div className="flex flex-wrap items-end gap-2">
        {DENOMINATIONS.map((d) => {
          const c = composition[d];
          if (!c) return null;
          return <Chip key={d} denom={d} count={c} size={44} />;
        })}
      </div>
      <p className="text-right font-display text-lg text-[--color-gold-300]">
        ${compositionTotal(composition).toLocaleString("es-MX")} ·{" "}
        {compositionCount(composition)} fichas
      </p>
    </div>
  );
}
