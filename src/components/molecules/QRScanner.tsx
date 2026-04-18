import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";

type Props = {
  onDecoded: (text: string) => void;
  onError?: (error: string) => void;
  paused?: boolean;
};

export function QRScanner({ onDecoded, onError, paused }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDecodedRef = useRef(onDecoded);
  const onErrorRef = useRef(onError);
  const [status, setStatus] = useState<"starting" | "running" | "error">(
    "starting",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep the latest callbacks in refs so we don't have to restart the camera
  // every time the parent re-renders (which happens whenever it passes an inline
  // arrow function — and that was breaking continuous decoding).
  useEffect(() => {
    onDecodedRef.current = onDecoded;
  }, [onDecoded]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    let controls: IScannerControls | null = null;
    const reader = new BrowserQRCodeReader();
    setStatus("starting");

    (async () => {
      try {
        // Using constraints lets the browser handle permissions and pick the rear
        // camera on mobile. More reliable than listing devices manually, especially
        // on iOS where labels are empty until permission is granted.
        controls = await reader.decodeFromConstraints(
          {
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoRef.current!,
          (result) => {
            if (cancelled) return;
            if (result) {
              onDecodedRef.current(result.getText());
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        setStatus("running");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error de cámara";
        setErrorMsg(msg);
        setStatus("error");
        onErrorRef.current?.(msg);
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [paused]);

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[--color-gold-500]/60 bg-black">
      <div className="relative aspect-square w-full">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <div className="pointer-events-none absolute inset-4 rounded-2xl border-2 border-[--color-gold-400]/80">
          <div className="scanline absolute inset-0 overflow-hidden rounded-2xl" />
        </div>
      </div>
      <div className="bg-[--color-smoke-800] px-4 py-2 text-center font-label text-xs text-[--color-cream]/80">
        {paused && "Pausado"}
        {!paused && status === "starting" && "Pidiendo permiso de cámara…"}
        {!paused && status === "running" && "Apunta al QR"}
        {!paused && status === "error" && (errorMsg ?? "Error con la cámara")}
      </div>
    </div>
  );
}
