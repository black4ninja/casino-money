import { useEffect, type ReactNode } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

type Props = {
  open: boolean;
  /** Disables closing while a submit is in-flight. */
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Shared modal chrome for any form that should open as an overlay (create,
 * edit, etc.). Same backdrop + chip-pop entrance as ConfirmDialog/ResultModal
 * so every modal in the app feels like the same physical artifact.
 *
 * The child is expected to be a self-contained Card-based form (e.g.
 * CreateUserForm, EditUserForm). The modal provides only the backdrop and
 * sizing container — no header/chrome of its own.
 */
export function FormModal({ open, busy, onClose, children }: Props) {
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => !busy && onClose()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        disabled={busy}
      />
      <div className="relative z-10 w-full max-w-md animate-chip-pop">
        {children}
      </div>
    </div>
  );
}
