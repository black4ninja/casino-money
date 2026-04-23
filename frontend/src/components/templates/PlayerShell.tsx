import { Suspense, lazy, useState } from "react";
import { Outlet } from "react-router-dom";
import { HandbookFab } from "../atoms/HandbookFab";

// Lazy — pulls in mermaid + prism + the deck only when a player opens the
// manual, keeping the initial bundle lean for everyone else.
const HandbookModal = lazy(() =>
  import("../organisms/HandbookModal").then((m) => ({ default: m.HandbookModal })),
);

/**
 * Shared chrome for every /player/* route. Hosts the handbook FAB + modal so
 * the pocket manual is one tap away regardless of which player screen they
 * are on. Deliberately transparent on purpose — we don't want to paint over
 * the wallpapers or gradients the individual pages paint themselves.
 */
export function PlayerShell() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Outlet />
      <HandbookFab onClick={() => setOpen(true)} />
      {open && (
        <Suspense fallback={null}>
          <HandbookModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
