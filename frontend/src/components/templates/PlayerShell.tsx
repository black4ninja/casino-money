import { Suspense, lazy, useState } from "react";
import { Outlet } from "react-router-dom";
import { HandbookFab } from "../atoms/HandbookFab";

// Lazy — pulls in mermaid + prism + the deck only when a player opens the
// manual, keeping the initial bundle lean for everyone else.
const HandbookModal = lazy(() =>
  import("../organisms/HandbookModal").then((m) => ({ default: m.HandbookModal })),
);

/**
 * Shared chrome for every /player/* route. Applies the landing-style fixed
 * wallpaper (same image used on the /dealer routes and the Login screen) so
 * the whole authenticated surface shares one cohesive visual environment.
 * Hosts the handbook FAB + modal so the pocket manual is one tap away from
 * any player screen.
 */
export function PlayerShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="landing-bg-fixed min-h-screen">
      <Outlet />
      <HandbookFab onClick={() => setOpen(true)} />
      {open && (
        <Suspense fallback={null}>
          <HandbookModal open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
