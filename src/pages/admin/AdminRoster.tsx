import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { ShareableQR, buildIngestURL } from "@/components/atoms/ShareableQR";
import { deriveKeypairFromPassword, isPasswordAcceptable } from "@/crypto/keys";
import { bytesToBase64Url } from "@/crypto/encoding";
import { createPlayerAccount } from "@/domain/player";
import { issueChip } from "@/domain/chip";
import { composeWelcome, compositionTotal } from "@/domain/composition";
import { DENOMINATIONS } from "@/domain/denominations";
import type { Chip as ChipType } from "@/domain/types";
import { encodeQR } from "@/qr/codec";
import { QR_VERSION, type WelcomeKitQR } from "@/qr/schemas";
import { useSessionStore } from "@/stores/sessionStore";
import type { Keypair } from "@/crypto/signatures";

type Kit = {
  alias: string;
  payload: string; // encoded QR
  url: string;
  amount: number;
  chipCount: number;
};

/**
 * Batch welcome-kit generator. The maestro types/pastes a roster, the app signs
 * one welcome-kit per alias (identity + secret key + welcome chips distributed
 * across the session's mesas), and each kit is shareable via a single link.
 * The student opens the link → becomes that student → has money → starts playing.
 */
export default function AdminRoster() {
  const session = useSessionStore((s) => s.session);

  const [password, setPassword] = useState("");
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [rosterInput, setRosterInput] = useState(
    "Ana\nBeto\nCarla\nDiego\nElena",
  );
  const [kits, setKits] = useState<Kit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session) return <Navigate to="/admin" replace />;

  const declaredMesas = session.mesas ?? [];
  const initialPerMesa = session.initialPerMesa ?? 1000;

  async function unlock() {
    setError(null);
    if (!isPasswordAcceptable(password)) {
      setError("Contraseña demasiado corta.");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const kp = deriveKeypairFromPassword(password, session!.salt);
      if (bytesToBase64Url(kp.publicKey) !== session!.dealerPubKey) {
        setError("Contraseña incorrecta.");
        return;
      }
      setKeypair(kp);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  const aliases = useMemo(
    () =>
      rosterInput
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 2),
    [rosterInput],
  );

  function generate() {
    if (!keypair) return;
    if (declaredMesas.length === 0) {
      setError(
        "La sesión no tiene mesas declaradas. Vuelve al admin y agrégalas.",
      );
      return;
    }
    if (aliases.length === 0) {
      setError("Agrega al menos un alumno en la lista.");
      return;
    }
    const composition = composeWelcome(initialPerMesa);
    const perMesaAmount = compositionTotal(composition);

    const newKits: Kit[] = aliases.map((alias) => {
      const account = createPlayerAccount(alias);
      const chips: ChipType[] = [];
      for (const mesaId of declaredMesas) {
        for (const d of DENOMINATIONS) {
          for (let i = 0; i < composition[d]; i++) {
            chips.push(
              issueChip({
                denom: d,
                sessionId: session!.sessionId,
                dealerId: mesaId,
                issuedTo: account.identity.playerId,
                dealerSecretKey: keypair!.secretKey,
              }),
            );
          }
        }
      }
      const kitQR: WelcomeKitQR = {
        v: QR_VERSION,
        type: "welcome-kit",
        session: session!,
        alias: account.identity.alias,
        secretKey: account.secretKey,
        playerId: account.identity.playerId,
        pubKey: account.identity.pubKey,
        chips,
      };
      const payload = encodeQR(kitQR);
      return {
        alias,
        payload,
        url: buildIngestURL(payload),
        amount: perMesaAmount * declaredMesas.length,
        chipCount: chips.length,
      };
    });
    setKits(newKits);
    setError(null);
  }

  function copyAllLinks() {
    const lines = kits.map((k) => `${k.alias}\n${k.url}\n`);
    navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => alert(`${kits.length} enlaces copiados al portapapeles.`))
      .catch(() => alert("No se pudo copiar. Usa los enlaces individuales."));
  }

  if (!keypair) {
    return (
      <AppLayout
        title="Alumnos"
        subtitle="Generar kits de bienvenida en batch"
        back={{ to: "/admin", label: "Admin" }}
      >
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-[--color-cream]/80">
            Desbloquea con la contraseña maestra para firmar kits en nombre
            del casino.
          </p>
          <Input
            label="Contraseña maestra"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-sm text-[--color-carmine-400]">{error}</p>}
          <Button variant="gold" block onClick={unlock} disabled={busy}>
            {busy ? "Verificando…" : "Desbloquear"}
          </Button>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Alumnos"
      subtitle={`${aliases.length} alumnos · $${(
        (compositionTotal(composeWelcome(initialPerMesa)) || 0) *
        declaredMesas.length
      ).toLocaleString("es-MX")} cada uno`}
      back={{ to: "/admin", label: "Admin" }}
    >
      {kits.length === 0 ? (
        <>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Badge tone="gold">SALDO INICIAL</Badge>
              <span className="font-display text-xl text-[--color-gold-300]">
                $
                {(
                  (compositionTotal(composeWelcome(initialPerMesa)) || 0) *
                  declaredMesas.length
                ).toLocaleString("es-MX")}
              </span>
              <span className="text-xs text-[--color-cream]/60">
                / jugador
              </span>
            </div>
            <p className="text-sm text-[--color-cream]/80">
              Se reparte en {declaredMesas.length} mesa
              {declaredMesas.length === 1 ? "" : "s"} ($
              {initialPerMesa.toLocaleString("es-MX")} por mesa):{" "}
              {declaredMesas.join(" · ")}
            </p>
            <p className="text-xs text-[--color-cream]/60">
              Si quieres cambiarlo, vuelve a crear la sesión con otros valores.
            </p>
          </Card>

          <Card className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-label text-xs text-[--color-cream]/70">
                LISTA DE ALUMNOS (UNO POR LÍNEA O SEPARADOS POR COMA)
              </span>
              <textarea
                value={rosterInput}
                onChange={(e) => setRosterInput(e.target.value)}
                placeholder="Ana&#10;Beto&#10;Carla"
                rows={8}
                className="rounded-xl border border-[--color-gold-500]/40 bg-[--color-smoke-800]/60 p-3 font-mono text-sm text-[--color-ivory]"
              />
            </label>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[--color-cream]/60">
                Alumnos detectados: {aliases.length}
              </span>
              {aliases.length > 0 && (
                <span className="text-[--color-cream]/60">
                  Total a firmar: {aliases.length} × {declaredMesas.length} mesas
                </span>
              )}
            </div>
            {error && <p className="text-sm text-[--color-carmine-400]">{error}</p>}
            <Button
              variant="gold"
              block
              onClick={generate}
              disabled={aliases.length === 0}
            >
              Generar {aliases.length} kit
              {aliases.length === 1 ? "" : "s"}
            </Button>
          </Card>
        </>
      ) : (
        <>
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Badge tone="gold">{kits.length} KITS LISTOS</Badge>
                <p className="mt-1 text-xs text-[--color-cream]/60">
                  Cada alumno recibe ${kits[0]?.amount.toLocaleString("es-MX")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setKits([])}>
                  Editar lista
                </Button>
                <Button variant="gold" size="sm" onClick={copyAllLinks}>
                  Copiar todos los enlaces
                </Button>
              </div>
            </div>
            <p className="text-xs text-[--color-cream]/70">
              Envía a cada alumno su enlace personal por WhatsApp, correo o
              escanear directamente su QR. Cuando lo abran, la app importa la
              identidad y las fichas automáticamente.
            </p>
          </Card>

          {kits.map((k) => (
            <KitCard key={k.alias + k.url} kit={k} />
          ))}
        </>
      )}
    </AppLayout>
  );
}

function KitCard({ kit }: { kit: Kit }) {
  const [expanded, setExpanded] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(kit.url);
      alert(`Enlace de ${kit.alias} copiado.`);
    } catch {
      alert(kit.url);
    }
  }

  async function shareLink() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: `Casino Money — ${kit.alias}`,
          text: `Tu kit de bienvenida: $${kit.amount.toLocaleString("es-MX")}`,
          url: kit.url,
        });
        return;
      } catch {
        // cancelled
      }
    }
    copyLink();
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg text-[--color-ivory]">
            {kit.alias}
          </p>
          <p className="text-xs text-[--color-cream]/60">
            ${kit.amount.toLocaleString("es-MX")} · {kit.chipCount} fichas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="felt" size="sm" onClick={copyLink}>
            Copiar
          </Button>
          <Button variant="gold" size="sm" onClick={shareLink}>
            Compartir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "✕" : "QR"}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="flex justify-center pt-1">
          <ShareableQR
            value={kit.payload}
            size={220}
            shareTitle={`Casino Money — ${kit.alias}`}
          />
        </div>
      )}
    </Card>
  );
}
