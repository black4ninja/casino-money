import { useState } from "react";
import { QRScanner } from "./QRScanner";
import { Button } from "../atoms/Button";
import { extractPayloadFromText } from "@/qr/codec";

type Props = {
  onDecoded: (text: string) => void;
  onError?: (error: string) => void;
  paused?: boolean;
};

/**
 * Wraps QRScanner with a manual paste fallback for devices that can't use the
 * camera (denied permission, shared computer, HTTP in dev, etc.).
 */
export function ScannerPanel({ onDecoded, onError, paused }: Props) {
  const [mode, setMode] = useState<"camera" | "paste">("camera");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitPaste() {
    if (!pasted.trim()) {
      setError("Pega el código primero.");
      return;
    }
    // Accepts raw codes (cm1:/cm2:), URL-encoded codes, or full share URLs with ?c=…
    const payload = extractPayloadFromText(pasted);
    if (!payload) {
      setError(
        "No encontré un código válido. Pega un código (cm1:/cm2:) o un enlace completo.",
      );
      return;
    }
    setError(null);
    setPasted("");
    onDecoded(payload);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <TabBtn active={mode === "camera"} onClick={() => setMode("camera")}>
          Cámara
        </TabBtn>
        <TabBtn active={mode === "paste"} onClick={() => setMode("paste")}>
          Pegar código
        </TabBtn>
      </div>

      {mode === "camera" ? (
        <QRScanner onDecoded={onDecoded} onError={onError} paused={paused} />
      ) : (
        <div className="flex flex-col gap-3 rounded-3xl border-2 border-[--color-gold-500]/60 bg-[--color-smoke-800]/80 p-4">
          <p className="font-label text-xs text-[--color-cream]/70">
            PEGA EL CÓDIGO O ENLACE QUE RECIBISTE
          </p>
          <textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="cm2:… o https://…/#/ingest?c=…"
            rows={5}
            className="w-full resize-none rounded-xl border border-[--color-gold-500]/40 bg-[--color-smoke]/70 p-3 font-mono text-xs text-[--color-ivory] placeholder-[--color-cream]/30 focus:border-[--color-gold-400] focus:outline-none"
          />
          {error && <p className="text-sm text-[--color-carmine-400]">{error}</p>}
          <Button onClick={submitPaste} variant="gold" block>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}

function TabBtn({
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
