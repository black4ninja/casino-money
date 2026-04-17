import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { QRScanner } from "@/components/molecules/QRScanner";
import { decodeQR } from "@/qr/codec";
import { useSessionStore } from "@/stores/sessionStore";
import { usePlayerStore } from "@/stores/playerStore";
import { createPlayerAccount } from "@/domain/player";

export default function PlayerHome() {
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const account = usePlayerStore((s) => s.account);
  const setAccount = usePlayerStore((s) => s.setAccount);
  const hydrate = usePlayerStore((s) => s.hydrateForSession);

  const [alias, setAlias] = useState(account?.identity.alias ?? "");
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSessionScan(text: string) {
    const r = decodeQR(text);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    if (r.payload.type !== "session") {
      setError("Escanea el QR de sesión que comparte el maestro.");
      return;
    }
    setSession(r.payload.session);
    setScanning(false);
    setError(null);
  }

  function handleContinue() {
    if (!session) {
      setError("Necesitas unirte a una sesión primero.");
      return;
    }
    if (alias.trim().length < 2) {
      setError("Escribe un alias (mínimo 2 letras).");
      return;
    }
    if (!account) {
      const newAccount = createPlayerAccount(alias.trim());
      setAccount(newAccount);
    } else if (account.identity.alias !== alias.trim()) {
      setAccount({
        ...account,
        identity: { ...account.identity, alias: alias.trim() },
      });
    }
    hydrate(session.sessionId);
    navigate("/player/wallet");
  }

  return (
    <AppLayout
      title="Jugador"
      subtitle="Crea tu alias y únete a la sesión"
      back={{ to: "/", label: "Inicio" }}
    >
      <Card className="flex flex-col gap-4">
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
            <QRScanner onDecoded={handleSessionScan} />
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
          label="Tu alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Ej. Ana, Beto…"
          maxLength={24}
        />
        {error && <p className="text-sm text-[--color-carmine-400]">{error}</p>}
        <Button
          variant="felt"
          block
          onClick={handleContinue}
          disabled={!session}
        >
          Entrar a la mesa
        </Button>
      </Card>
    </AppLayout>
  );
}
