import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { ScannerPanel } from "@/components/organisms/ScannerPanel";
import { decodeQR } from "@/qr/codec";
import { deriveKeypairFromPassword, isPasswordAcceptable } from "@/crypto/keys";
import { bytesToBase64Url } from "@/crypto/encoding";
import { useSessionStore } from "@/stores/sessionStore";
import { useDealerStore } from "@/stores/dealerStore";

export default function DealerLogin() {
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const login = useDealerStore((s) => s.login);
  const lastMesa = useDealerStore((s) => s.dealerId);

  const [password, setPassword] = useState("");
  const [mesa, setMesa] = useState(lastMesa ?? "Mesa-1");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function attempt() {
    setError(null);
    if (!session) {
      setError("Primero escanea el QR de sesión.");
      return;
    }
    if (!isPasswordAcceptable(password)) {
      setError("Contraseña demasiado corta.");
      return;
    }
    if (mesa.trim().length < 2) {
      setError("Nombre de mesa inválido.");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const kp = deriveKeypairFromPassword(password, session.salt);
      if (bytesToBase64Url(kp.publicKey) !== session.dealerPubKey) {
        setError("Contraseña incorrecta.");
        return;
      }
      login({
        keypair: kp,
        dealerId: mesa.trim(),
        sessionId: session.sessionId,
      });
      navigate("/dealer/menu");
    } finally {
      setBusy(false);
    }
  }

  function handleSessionScan(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.payload.type !== "session") {
      setError("Ese QR no es una sesión.");
      return;
    }
    setSession(r.payload.session);
    setScanning(false);
  }

  return (
    <AppLayout
      title="Acceso dealer"
      subtitle="Contraseña maestra + nombre de mesa"
      back={{ to: "/", label: "Inicio" }}
    >
      <Card className="flex flex-col gap-3">
        {session ? (
          <div className="flex items-center justify-between rounded-xl bg-[--color-felt-700]/60 px-4 py-2">
            <span className="font-label text-xs text-[--color-cream]/70">
              SESIÓN
            </span>
            <span className="font-display text-sm text-[--color-gold-300]">
              {session.label}
            </span>
          </div>
        ) : scanning ? (
          <div className="flex flex-col gap-3">
            <ScannerPanel onDecoded={handleSessionScan} />
            <Button variant="ghost" onClick={() => setScanning(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="gold" block onClick={() => setScanning(true)}>
            Escanear QR de sesión
          </Button>
        )}
        <Input
          label="Nombre de la mesa"
          value={mesa}
          onChange={(e) => setMesa(e.target.value)}
          placeholder="Mesa-1"
        />
        <Input
          label="Contraseña maestra"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-[--color-carmine-400]">{error}</p>}
        <Button onClick={attempt} block variant="felt" disabled={busy || !session}>
          {busy ? "Verificando…" : "Iniciar turno"}
        </Button>
      </Card>
    </AppLayout>
  );
}
