import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

type Props = {
  source: string;
  /** Accessible label describing the diagram. */
  label?: string;
};

let _mermaidInit = false;
function ensureInit() {
  if (_mermaidInit) return;
  _mermaidInit = true;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "strict",
    fontFamily: "Inter, system-ui, sans-serif",
    themeVariables: {
      primaryColor: "#0f3a2a",
      primaryTextColor: "#f5e6ca",
      primaryBorderColor: "#d4af37",
      lineColor: "#d4af37",
      secondaryColor: "#1b4f3a",
      tertiaryColor: "#062018",
      background: "transparent",
      mainBkg: "#0f3a2a",
      classText: "#f5e6ca",
    },
  });
}

/**
 * Renders a Mermaid source string to inline SVG. Re-renders whenever the
 * source changes. Keeps its own id so multiple diagrams in the same page
 * don't collide.
 */
export function MermaidDiagram({ source, label }: Props) {
  const id = useId().replace(/:/g, "_");
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureInit();
    mermaid
      .render(`mmd-${id}`, source)
      .then(({ svg }) => {
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = svg;
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-[--color-chip-red-500]/10 p-3 font-mono text-xs text-[--color-chip-red-300]"
      >
        No pudimos renderizar el diagrama: {error}
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label ?? "Diagrama UML"}
      className="mermaid-host flex w-full justify-center overflow-x-auto [&>svg]:h-auto [&>svg]:max-w-full"
    />
  );
}
