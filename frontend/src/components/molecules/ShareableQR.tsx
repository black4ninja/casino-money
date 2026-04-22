import { useState } from "react";
import { QRCanvas } from "../atoms/QRCanvas";

type Props = {
  value: string;
  label?: string;
  size?: number;
  /** Text shown in the native share sheet title, when available. */
  shareTitle?: string;
};

/** Builds an absolute URL that, when opened, loads the app and ingests the payload. */
export function buildIngestURL(payload: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${location.origin}${base}#/ingest?c=${encodeURIComponent(payload)}`;
}

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareableQR({ value, label, size, shareTitle }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);

  function flash(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2500);
  }

  async function onCopyCode() {
    if (await writeClipboard(value)) {
      flash("Código copiado");
    } else {
      setShowText(true);
      flash("Selecciona y copia manualmente");
    }
  }

  async function onShareLink() {
    const url = buildIngestURL(value);
    const shareData = { title: shareTitle ?? "Casino Money", url };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled — fall through to clipboard fallback
      }
    }
    if (await writeClipboard(url)) {
      flash("Enlace copiado");
    } else {
      setShowText(true);
      flash("Selecciona y copia el enlace");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <QRCanvas value={value} size={size} label={label} />
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onCopyCode}
          className="rounded-full border border-[--color-gold-500]/50 bg-[--color-smoke-800]/70 px-4 py-1.5 font-label text-xs tracking-wider text-[--color-cream]/90 hover:bg-[--color-smoke-700]"
        >
          Copiar código
        </button>
        <button
          type="button"
          onClick={onShareLink}
          className="rounded-full border border-[--color-gold-500]/50 bg-[--color-smoke-800]/70 px-4 py-1.5 font-label text-xs tracking-wider text-[--color-cream]/90 hover:bg-[--color-smoke-700]"
        >
          Compartir enlace
        </button>
      </div>
      {notice && (
        <p className="font-label text-xs text-[--color-gold-300]">{notice}</p>
      )}
      {showText && (
        <textarea
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="mt-1 w-full max-w-sm resize-none rounded-lg bg-[--color-smoke-800]/70 p-2 font-mono text-[10px] text-[--color-cream]/80"
          rows={4}
        />
      )}
    </div>
  );
}
