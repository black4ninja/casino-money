import { useEffect, type ReactNode } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";

type ConfirmTone = "danger" | "gold" | "info" | "primary" | "purple";

type Props = {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Button variant for the confirm button — tone signals severity. */
  tone?: ConfirmTone;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Generic confirm modal — used for archive / delete / any destructive or
 * lifecycle-changing action. Follows the same chrome as ResultModal (dark
 * backdrop + animate-chip-pop card) so confirms feel native to the casino
 * theme without adding new keyframes.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  tone = "danger",
  confirmLabel,
  cancelLabel = "Cancelar",
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => !loading && onCancel()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-md animate-chip-pop">
        <Card
          tone="night"
          style={{ marginInline: 0 }}
          className="ring-1 ring-inset ring-white/10"
        >
          <h2
            id="confirm-dialog-title"
            className="font-display text-2xl text-[--color-ivory]"
          >
            {title}
          </h2>
          {description && (
            <div className="mt-3 text-sm text-[--color-cream]/80">
              {description}
            </div>
          )}
          {error && (
            <p
              className="mt-3 font-label text-xs tracking-wider text-[--color-chip-red-300]"
              role="alert"
            >
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={onCancel} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={tone} onClick={onConfirm} disabled={loading} autoFocus>
              {loading ? "Procesando…" : confirmLabel}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
