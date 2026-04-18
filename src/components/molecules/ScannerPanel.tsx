import { useState } from "react";
import { QRScanner } from "./QRScanner";
import { Button } from "../atoms/Button";

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
    const text = pasted.trim();
    if (!text) {
      setError("Pega el código primero.");
      return;
    }
    // Extract the cm1: payload from either raw paste or a full ingest URL.
    const match = text.match(/cm1:[^\s"'<>]+/);
    if (!match) {
      setError("El código debe empezar con cm1:");
      return;
    }
    setError(null);
    setPasted("");
    onDecoded(match[0]);
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
            placeholder="cm1:... o https://…/#/ingest?c=…"
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
