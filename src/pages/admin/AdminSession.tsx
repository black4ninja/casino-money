import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Badge } from "@/components/atoms/Badge";
import { QRCanvas } from "@/components/atoms/QRCanvas";
import { QRScanner } from "@/components/molecules/QRScanner";
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
      const newSession: Session = {
        sessionId: crypto.randomUUID(),
        dealerPubKey: bytesToBase64Url(kp.publicKey),
        salt,
        label: label.trim() || "Sesión Casino",
        startedAt: Date.now(),
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
          <QRCanvas value={encodeQR(qr)} label="QR de sesión" />
          <p className="text-center text-sm text-[--color-cream]/70">
            Cualquiera que escanee este QR podrá unirse. Los talladores, además,
            necesitan la contraseña maestra para poder firmar fichas.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link to="/admin/overview">
              <Button variant="gold">Ver estadísticas</Button>
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
            <QRScanner onDecoded={adoptScannedSession} />
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
