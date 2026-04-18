import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { ScannerPanel } from "@/components/molecules/ScannerPanel";
import { decodeQR } from "@/qr/codec";
import type { AnyQR } from "@/qr/schemas";
import { useSessionStore } from "@/stores/sessionStore";
import { usePlayerStore } from "@/stores/playerStore";
import { base64UrlToBytes } from "@/crypto/encoding";
import { verifyChipSignature, verifyWalletChip } from "@/domain/chip";
import { verifyEndorsementSignatures } from "@/domain/endorsement";
import type { HistoryEntry, WalletChip } from "@/domain/types";
import type { PlayerAccount } from "@/domain/player";

type Processed =
  | { kind: "decoded"; payload: AnyQR; raw: string }
  | { kind: "error"; message: string };

export default function Ingest() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const account = usePlayerStore((s) => s.account);
  const setAccount = usePlayerStore((s) => s.setAccount);
  const addChips = usePlayerStore((s) => s.addChips);
  const appendHistory = usePlayerStore((s) => s.appendHistory);
  const hydrate = usePlayerStore((s) => s.hydrateForSession);

  const [state, setState] = useState<Processed | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  useEffect(() => {
    const raw = params.get("c");
    if (raw) tryDecode(raw);
  }, [params]);

  function tryDecode(raw: string) {
    const r = decodeQR(raw);
    if (!r.ok) {
      setState({ kind: "error", message: r.error });
      return;
    }
    setState({ kind: "decoded", payload: r.payload, raw });
  }

  function applySession() {
    if (state?.kind !== "decoded" || state.payload.type !== "session") return;
    setSession(state.payload.session);
    setApplied("Sesión activada. Puedes volver al inicio.");
  }

  function applyWelcomeKit() {
    if (state?.kind !== "decoded" || state.payload.type !== "welcome-kit") return;
    const kit = state.payload;
    // Save the session so the pubkey and mesas are available.
    setSession(kit.session);
    // Import the student's pre-made account.
    const kitAccount: PlayerAccount = {
      identity: {
        playerId: kit.playerId,
        pubKey: kit.pubKey,
        alias: kit.alias,
      },
      secretKey: kit.secretKey,
    };
    setAccount(kitAccount);

    // Verify every chip before adding to the wallet.
    const dealerPubKey = base64UrlToBytes(kit.session.dealerPubKey);
    const acceptable: WalletChip[] = [];
    let rejected = 0;
    for (const chip of kit.chips) {
      if (chip.issuedTo !== kit.playerId) {
        rejected++;
        continue;
      }
      if (!verifyChipSignature(chip, dealerPubKey)) {
        rejected++;
        continue;
      }
      acceptable.push({ chip, endorsements: [] });
    }
    if (acceptable.length > 0) {
      addChips(kit.session.sessionId, acceptable);
      const history: HistoryEntry[] = acceptable.map((wc) => ({
        kind: "receive",
        serial: wc.chip.serial,
        denom: wc.chip.denom,
        from: wc.chip.dealerId,
        at: Date.now(),
      }));
      appendHistory(kit.session.sessionId, history);
      hydrate(kit.session.sessionId);
    }
    const total = acceptable.reduce((a, wc) => a + wc.chip.denom, 0);
    const msg = rejected
      ? `Bienvenido/a, ${kit.alias}. $${total.toLocaleString("es-MX")} agregado (${rejected} ficha${rejected === 1 ? "" : "s"} rechazada${rejected === 1 ? "" : "s"}).`
      : `Bienvenido/a, ${kit.alias}. $${total.toLocaleString("es-MX")} agregados a tu cartera.`;
    setApplied(msg);
  }

  function applyChipsOrTransfer() {
    if (state?.kind !== "decoded") return;
    if (!session || !account) {
      setState({
        kind: "error",
        message:
          "Necesitas entrar como jugador primero (crear alias y escanear la sesión).",
      });
      return;
    }
    const dealerPubKey = base64UrlToBytes(session.dealerPubKey);

    if (state.payload.type === "chips") {
      const p = state.payload;
      if (p.sessionId !== session.sessionId) {
        setState({
          kind: "error",
          message: "Estas fichas son de otra sesión.",
        });
        return;
      }
      if (p.toPlayerId !== account.identity.playerId) {
        setState({
          kind: "error",
          message: "Estas fichas fueron firmadas para otro jugador.",
        });
        return;
      }
      const invalid = p.chips.filter(
        (c) => !verifyChipSignature(c, dealerPubKey),
      );
      if (invalid.length > 0) {
        setState({
          kind: "error",
          message: `${invalid.length} ficha(s) con firma inválida.`,
        });
        return;
      }
      const wcs: WalletChip[] = p.chips.map((chip) => ({
        chip,
        endorsements: [],
      }));
      addChips(session.sessionId, wcs);
      const history: HistoryEntry[] = wcs.map((wc) => ({
        kind: "receive",
        serial: wc.chip.serial,
        denom: wc.chip.denom,
        from: wc.chip.dealerId,
        at: Date.now(),
      }));
      appendHistory(session.sessionId, history);
      const total = wcs.reduce((a, wc) => a + wc.chip.denom, 0);
      setApplied(`Recibiste $${total.toLocaleString("es-MX")} de ${p.dealerId}.`);
      return;
    }

    if (state.payload.type === "transfer") {
      const p = state.payload;
      const pubMap: Record<string, Uint8Array> = {};
      for (const [pid, b64] of Object.entries(p.pubKeys)) {
        pubMap[pid] = base64UrlToBytes(b64);
      }
      const acceptable: WalletChip[] = [];
      for (const wc of p.walletChips) {
        const basic = verifyWalletChip(wc, {
          dealerPubKey,
          sessionId: session.sessionId,
          expectedOwner: account.identity.playerId,
        });
        if (!basic.ok) continue;
        const sigs = verifyEndorsementSignatures(wc, pubMap);
        if (!sigs.ok) continue;
        acceptable.push(wc);
      }
      if (acceptable.length === 0) {
        setState({
          kind: "error",
          message:
            "Ninguna ficha transferible fue válida. Puede que hayan sido enviadas a otro jugador.",
        });
        return;
      }
      addChips(session.sessionId, acceptable);
      const history: HistoryEntry[] = acceptable.map((wc) => ({
        kind: "transfer-in",
        serial: wc.chip.serial,
        denom: wc.chip.denom,
        from: p.fromPlayerId,
        alias: p.fromAlias,
        at: Date.now(),
      }));
      appendHistory(session.sessionId, history);
      const total = acceptable.reduce((a, wc) => a + wc.chip.denom, 0);
      setApplied(`Recibiste $${total.toLocaleString("es-MX")} de ${p.fromAlias}.`);
    }
  }

  function goToWallet() {
    if (session) hydrate(session.sessionId);
    navigate("/player/wallet");
  }

  return (
    <AppLayout
      title="Importar código"
      subtitle="Pega o escanea un código recibido por enlace"
      back={{ to: "/", label: "Inicio" }}
    >
      {state === null && (
        <Card>
          <p className="mb-3 text-sm text-[--color-cream]/70">
            Si alguien te compartió un enlace o un texto que empieza con{" "}
            <span className="font-mono text-[--color-gold-300]">cm1:</span>,
            pégalo aquí.
          </p>
          <ScannerPanel onDecoded={tryDecode} />
        </Card>
      )}

      {state?.kind === "error" && (
        <Card>
          <Badge tone="danger">ERROR</Badge>
          <p className="mt-3 text-sm text-[--color-cream]">{state.message}</p>
          <div className="mt-4 flex gap-2">
            <Button variant="felt" onClick={() => setState(null)}>
              Intentar otro código
            </Button>
            <Link to="/">
              <Button variant="ghost">Inicio</Button>
            </Link>
          </div>
        </Card>
      )}

      {state?.kind === "decoded" && applied === null && (
        <Decoded
          payload={state.payload}
          hasSession={!!session}
          hasAccount={!!account}
          onApplySession={applySession}
          onApplyChips={applyChipsOrTransfer}
          onApplyWelcomeKit={applyWelcomeKit}
        />
      )}

      {applied && (
        <Card>
          <Badge tone="gold">APLICADO</Badge>
          <p className="mt-3 text-sm text-[--color-cream]">{applied}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {state?.kind === "decoded" &&
              (state.payload.type === "chips" ||
                state.payload.type === "transfer" ||
                state.payload.type === "welcome-kit") && (
                <Button variant="gold" onClick={goToWallet}>
                  Ver cartera
                </Button>
              )}
            {state?.kind === "decoded" && state.payload.type === "session" && (
              <Link to="/">
                <Button variant="gold">Inicio</Button>
              </Link>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                setState(null);
                setApplied(null);
              }}
            >
              Importar otro
            </Button>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}

function Decoded({
  payload,
  hasSession,
  hasAccount,
  onApplySession,
  onApplyChips,
  onApplyWelcomeKit,
}: {
  payload: AnyQR;
  hasSession: boolean;
  hasAccount: boolean;
  onApplySession: () => void;
  onApplyChips: () => void;
  onApplyWelcomeKit: () => void;
}) {
  switch (payload.type) {
    case "session":
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="gold">SESIÓN</Badge>
          <p className="font-display text-lg">{payload.session.label}</p>
          <p className="text-xs text-[--color-cream]/60 font-mono">
            {payload.session.sessionId.slice(0, 12)}
          </p>
          <Button variant="gold" onClick={onApplySession} block>
            Usar esta sesión en este dispositivo
          </Button>
        </Card>
      );
    case "welcome-kit": {
      const total = payload.chips.reduce((a, c) => a + c.denom, 0);
      const willReplace = hasAccount;
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="gold">KIT DE BIENVENIDA</Badge>
          <p className="font-display text-2xl gold-shine">{payload.alias}</p>
          <p className="text-sm text-[--color-cream]/80">
            ${total.toLocaleString("es-MX")} en {payload.chips.length} fichas ·
            {" "}
            {payload.session.label}
          </p>
          <p className="text-xs text-[--color-cream]/60">
            Este kit contiene tu identidad y tu saldo inicial. Al aceptar, tu
            app se configura como {payload.alias} y podrás empezar a jugar.
          </p>
          {willReplace && (
            <p className="text-xs text-[--color-carmine-400]">
              Ya tienes una cuenta en este dispositivo. Al aceptar, se
              reemplaza por la cuenta de {payload.alias}.
            </p>
          )}
          <Button variant="gold" onClick={onApplyWelcomeKit} block>
            Soy {payload.alias} — entrar al casino
          </Button>
        </Card>
      );
    }
    case "chips":
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="gold">FICHAS</Badge>
          <p className="text-sm">
            {payload.chips.length} ficha(s) de{" "}
            <span className="font-display text-[--color-gold-300]">
              {payload.dealerId}
            </span>
          </p>
          <p className="text-xs text-[--color-cream]/60">
            Total: $
            {payload.chips
              .reduce((a, c) => a + c.denom, 0)
              .toLocaleString("es-MX")}
          </p>
          {(!hasSession || !hasAccount) && (
            <p className="text-xs text-[--color-carmine-400]">
              Entra como jugador primero.
            </p>
          )}
          <Button
            variant="gold"
            onClick={onApplyChips}
            block
            disabled={!hasSession || !hasAccount}
          >
            Recibir fichas
          </Button>
        </Card>
      );
    case "transfer":
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="gold">TRANSFERENCIA</Badge>
          <p className="text-sm">
            De{" "}
            <span className="font-display text-[--color-gold-300]">
              {payload.fromAlias}
            </span>
          </p>
          <p className="text-xs text-[--color-cream]/60">
            {payload.walletChips.length} ficha(s) · $
            {payload.walletChips
              .reduce((a, wc) => a + wc.chip.denom, 0)
              .toLocaleString("es-MX")}
          </p>
          <Button
            variant="gold"
            onClick={onApplyChips}
            block
            disabled={!hasSession || !hasAccount}
          >
            Aceptar transferencia
          </Button>
        </Card>
      );
    case "identity":
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="felt">IDENTIDAD</Badge>
          <p className="font-display text-lg">{payload.identity.alias}</p>
          <p className="text-xs text-[--color-cream]/60">
            Abre <strong>Jugador → Transferir</strong> y pega el código ahí para
            iniciar un pago a este jugador, o como tallador emite fichas a
            este alias desde tu mesa.
          </p>
        </Card>
      );
    case "redeem":
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="felt">PAGO DE JUGADOR</Badge>
          <p className="text-xs text-[--color-cream]/70">
            Este código es un pago dirigido a una mesa específica. Abre{" "}
            <strong>Mesa → Cobrar apuesta</strong> e importa el código desde la
            pestaña <em>Pegar código</em>.
          </p>
        </Card>
      );
    case "receipt":
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="felt">RECIBO</Badge>
          <p className="text-xs text-[--color-cream]/70">
            Este código confirma un pago. Ábrelo desde{" "}
            <strong>Jugador → Pagar → Escanear recibo</strong> para marcar las
            fichas correspondientes como gastadas.
          </p>
        </Card>
      );
    case "dealer-stats":
      return (
        <Card className="flex flex-col gap-3">
          <Badge tone="felt">ESTADÍSTICAS</Badge>
          <p className="text-sm">
            Mesa{" "}
            <span className="font-display text-[--color-gold-300]">
              {payload.dealerId}
            </span>
          </p>
          <p className="text-xs text-[--color-cream]/70">
            Importa este código desde <strong>Admin → Ver estadísticas</strong>.
          </p>
        </Card>
      );
  }
}
