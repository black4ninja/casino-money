import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

type Props = {
  onDecoded: (text: string) => void;
  onError?: (error: string) => void;
  paused?: boolean;
};

export function QRScanner({ onDecoded, onError, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<"idle" | "starting" | "running" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    const reader = new BrowserQRCodeReader();
    setStatus("starting");
    (async () => {
      try {
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (devices.length === 0) {
          throw new Error("No se detectó cámara.");
        }
        // Prefer rear-facing camera when available (Android/iOS).
        const rear = devices.find((d) => /back|rear|environment/i.test(d.label));
        const deviceId = (rear ?? devices[0]).deviceId;
        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current!,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              onDecoded(result.getText());
            } else if (err && err.name !== "NotFoundException") {
              // NotFoundException is the "no QR in frame" signal; ignore it.
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus("running");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setErrorMsg(msg);
        setStatus("error");
        onError?.(msg);
      }
    })();
    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onDecoded, onError, paused]);

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[--color-gold-500]/60 bg-black">
      <div className="relative aspect-square w-full">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />
        {/* Overlay frame */}
        <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-[--color-gold-400]/80">
          <div className="scanline absolute inset-0 overflow-hidden rounded-2xl" />
        </div>
      </div>
      <div className="bg-[--color-smoke-800] px-4 py-2 text-center font-label text-xs text-[--color-cream]/80">
        {status === "starting" && "Pidiendo permiso de cámara…"}
        {status === "running" && "Apunta al QR"}
        {status === "error" && (errorMsg ?? "Error con la cámara")}
        {paused && "Pausado"}
      </div>
    </div>
  );
}
