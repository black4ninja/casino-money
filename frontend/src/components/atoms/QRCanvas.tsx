import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  size?: number;
  label?: string;
};

export function QRCanvas({ value, size = 280, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(
      canvas,
      value,
      {
        errorCorrectionLevel: "M",
        margin: 1,
        width: size,
        color: {
          dark: "#0B4030",
          light: "#F8F4EA",
        },
      },
      (err) => {
        setError(err ? "No se pudo generar el QR (demasiado largo)." : null);
      },
    );
  }, [value, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative rounded-2xl border-4 border-[--color-gold-500] bg-[--color-cream] p-2 shadow-[0_0_28px_rgba(212,175,55,0.35)]">
        <canvas ref={canvasRef} width={size} height={size} />
      </div>
      {label && (
        <span className="font-label text-xs text-[--color-cream]/80">
          {label}
        </span>
      )}
      {error && (
        <span className="text-xs text-[--color-carmine-400]">{error}</span>
      )}
    </div>
  );
}
