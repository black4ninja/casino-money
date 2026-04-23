import { useEffect, useRef } from "react";

type Options = {
  /** Interval between polls, in milliseconds. */
  intervalMs: number;
  /** When true, polling is suspended. Toggle this to start/stop cleanly. */
  paused?: boolean;
  /**
   * When true (default), ticks are silently skipped while the document is
   * hidden (tab in background). A tick resumes immediately when the tab
   * becomes visible again, so returning users see fresh data without waiting
   * for the next interval.
   */
  pauseWhenHidden?: boolean;
  /**
   * When true (default), run `fn` once immediately on mount, separate from
   * the first scheduled tick. Use `false` if the caller has already fetched
   * the initial value elsewhere and only wants periodic refreshes.
   */
  immediate?: boolean;
};

/**
 * Generic polling hook — runs `fn` on a fixed cadence while the component
 * is mounted and the tab is visible. Standardized for the project so any
 * screen that needs "live updates without sockets" uses the same contract.
 *
 * Design notes:
 *   • Recursive setTimeout (not setInterval) so a slow request can't overlap
 *     the next tick.
 *   • `fn` is captured in a ref so changing it between renders does NOT
 *     restart the timer — only `intervalMs`, `paused`, or `pauseWhenHidden`
 *     toggles reset the schedule.
 *   • Errors from `fn` are swallowed here; surface them inside `fn` itself
 *     via setState so the UI can reflect load/error state.
 *
 * Example:
 *   usePolling(refetchLastSpin, { intervalMs: 4000 });
 */
export function usePolling(
  fn: () => void | Promise<void>,
  options: Options,
): void {
  const {
    intervalMs,
    paused = false,
    pauseWhenHidden = true,
    immediate = true,
  } = options;

  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    if (paused) return;

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    async function run() {
      if (cancelled) return;
      const hidden =
        pauseWhenHidden && typeof document !== "undefined" &&
        document.visibilityState === "hidden";
      if (!hidden) {
        try {
          await fnRef.current();
        } catch {
          // Intentionally swallowed — see the hook's JSDoc.
        }
      }
      if (cancelled) return;
      timerId = setTimeout(run, intervalMs);
    }

    // Kick visibility changes → immediate refresh when the tab returns to
    // the foreground, so users don't wait for the next scheduled tick.
    function onVisibilityChange() {
      if (!pauseWhenHidden) return;
      if (document.visibilityState !== "visible") return;
      if (cancelled) return;
      if (timerId !== null) clearTimeout(timerId);
      run();
    }

    if (immediate) {
      run();
    } else {
      timerId = setTimeout(run, intervalMs);
    }

    if (pauseWhenHidden && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      cancelled = true;
      if (timerId !== null) clearTimeout(timerId);
      if (pauseWhenHidden && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [intervalMs, paused, pauseWhenHidden, immediate]);
}
