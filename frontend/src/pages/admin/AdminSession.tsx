import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { ShareableQR } from "@/components/molecules/ShareableQR";
import { ScannerPanel } from "@/components/organisms/ScannerPanel";
import { deriveKeypairFromPassword, isPasswordAcceptable } from "@/crypto/keys";
import { bytesToBase64Url } from "@/crypto/encoding";
import { randomSalt } from "@/crypto/random";
import { encodeQR, decodeQR } from "@/qr/codec";
import type { SessionQR } from "@/qr/schemas";
import { QR_VERSION } from "@/qr/schemas";
import { useSessionStore } from "@/stores/sessionStore";
import type { Session } from "@/domain/types";

export default function AdminSession() {
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const clearSession = useSessionStore((s) => s.clear);

  const [label, setLabel] = useState("Casino Primavera 2026");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [mesasInput, setMesasInput] = useState("Mesa-1, Mesa-2, Mesa-3");
  const [initialPerMesa, setInitialPerMesa] = useState("1000");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);

  async function createSession() {
    setError(null);
    if (!isPasswordAcceptable(password)) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPw) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const salt = randomSalt();
      // Give the UI a breath so the spinner renders before PBKDF2 blocks.
      await new Promise((r) => setTimeout(r, 30));
      const kp = deriveKeypairFromPassword(password, salt);
      const mesas = mesasInput
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);
      const initial = Math.max(0, Math.floor(Number(initialPerMesa) || 0));
      const newSession: Session = {
        sessionId: crypto.randomUUID(),
        dealerPubKey: bytesToBase64Url(kp.publicKey),
        salt,
        label: label.trim() || "Sesión Casino",
        startedAt: Date.now(),
        mesas: mesas.length > 0 ? mesas : undefined,
        initialPerMesa: initial > 0 ? initial : undefined,
      };
      setSession(newSession);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy(false);
    }
  }

  function adoptScannedSession(text: string) {
    const res = decodeQR(text);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (res.payload.type !== "session") {
      setError("Ese QR no es una sesión.");
      return;
    }
    setSession(res.payload.session);
    setScanning(false);
  }

  if (session) {
    const qr: SessionQR = { v: QR_VERSION, type: "session", session };
    return (
      <AppLayout
        title="Sesión activa"
        subtitle="Comparte este QR con talladores y jugadores"
        back={{ to: "/", label: "Inicio" }}
      >
        <Card className="flex flex-col items-center gap-4">
          <Badge tone="gold">{session.label}</Badge>
          <ShareableQR value={encodeQR(qr)} label="QR de sesión" />
          <p className="text-center text-sm text-[--color-cream]/70">
            Cualquiera que escanee este QR podrá unirse. Los talladores, además,
            necesitan la contraseña maestra para poder firmar fichas.
          </p>
          {(session.mesas?.length ?? 0) > 0 && (
            <div className="w-full rounded-xl bg-[--color-smoke-800]/60 p-3 text-xs">
              <p className="font-label text-[--color-cream]/70">
                MESAS: {session.mesas?.join(" · ")}
              </p>
              {session.initialPerMesa && (
                <p className="mt-1 text-[--color-cream]/60">
                  Saldo inicial por mesa: ${session.initialPerMesa} ·{" "}
                  Total/jugador: $
                  {(session.initialPerMesa * (session.mesas?.length ?? 1)).toLocaleString("es-MX")}
                </p>
              )}
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link to="/admin/roster">
              <Button variant="gold">Alumnos (batch)</Button>
            </Link>
            <Link to="/admin/caja">
              <Button variant="felt">Caja (1 a 1)</Button>
            </Link>
            <Link to="/admin/overview">
              <Button variant="felt">Estadísticas</Button>
            </Link>
            <Button
              variant="danger"
              onClick={() => {
                if (
                  window.confirm(
                    "¿Cerrar la sesión activa? Los jugadores pueden seguir usando su wallet, pero este dispositivo dejará de verla.",
                  )
                ) {
                  clearSession();
                }
              }}
            >
              Cerrar sesión
            </Button>
          </div>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Crear sesión"
      subtitle="Define contraseña maestra — los talladores la usarán para firmar fichas"
      back={{ to: "/", label: "Inicio" }}
    >
      <Card className="flex flex-col gap-4">
        <Input
          label="Nombre de la sesión"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Casino Primavera 2026"
        />
        <Input
          label="Contraseña maestra"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Mínimo 8 caracteres. No se almacena: se deriva a la clave del dealer."
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
        />
        <Input
          label="Mesas del casino (separadas por coma)"
          value={mesasInput}
          onChange={(e) => setMesasInput(e.target.value)}
          placeholder="Mesa-1, Mesa-2, Mesa-3"
          hint="Los talladores usarán estos nombres al iniciar su mesa."
        />
        <Input
          label="Saldo inicial por mesa para cada jugador"
          type="number"
          value={initialPerMesa}
          onChange={(e) => setInitialPerMesa(e.target.value)}
          placeholder="1000"
          hint="Recomendado: $1000 por mesa para sesiones de 2–3 horas con apuestas de $100–$500. Con 3 mesas, cada jugador recibe $3000 total."
        />
        {error && <p className="text-sm text-[--color-carmine-400]">{error}</p>}
        <Button onClick={createSession} disabled={busy} block variant="gold">
          {busy ? "Derivando clave…" : "Crear sesión"}
        </Button>
      </Card>
      <Card tone="night">
        <h2 className="font-label text-sm text-[--color-cream]/80">
          ¿Ya tienes un QR de sesión existente?
        </h2>
        <p className="mt-1 text-sm text-[--color-cream]/70">
          Escanéalo para que este dispositivo verifique las fichas con la misma clave.
        </p>
        <div className="mt-3">
          {scanning ? (
            <ScannerPanel onDecoded={adoptScannedSession} />
          ) : (
            <Button variant="ghost" onClick={() => setScanning(true)}>
              Escanear QR de sesión
            </Button>
          )}
        </div>
      </Card>
    </AppLayout>
  );
}
