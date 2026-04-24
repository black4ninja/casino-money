import { Outlet } from "react-router-dom";

/**
 * Shared chrome for every /dealer/* route: applies the landing-style
 * background (fixed-attached cover image + dark overlay) so dealers see a
 * more immersive, casino-lobby feel instead of the default felt tone used
 * on admin screens. Individual pages render inside <Outlet />; they should
 * NOT set their own opaque page background, otherwise it will hide this.
 */
export function DealerShell() {
  return (
    <div className="landing-bg-fixed min-h-screen">
      <Outlet />
    </div>
  );
}
