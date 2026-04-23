import { Link } from "react-router-dom";
import { RuletaGameView } from "@/components/organisms/games/RuletaGameView";

/**
 * Standalone page for /juegos/ruleta. Thin wrapper — the playable view
 * lives in <RuletaGameView /> and is reused from the dealer mesa tabs.
 */
export default function Ruleta() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2.5rem",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <Link
          to="/juegos"
          aria-label="Volver"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.5rem",
            height: "2.5rem",
            flexShrink: 0,
            borderRadius: "9999px",
            border: "1px solid rgba(212, 175, 55, 0.4)",
            color: "rgba(245, 230, 202, 0.8)",
            fontSize: "1.125rem",
            textDecoration: "none",
          }}
        >
          ←
        </Link>
        <div style={{ flex: 1, textAlign: "center" }}>
          <h1 className="gold-shine font-display text-3xl leading-none md:text-4xl">
            Ruleta de Patrones
          </h1>
          <p className="mt-1 font-label text-xs text-[--color-cream]/70 md:text-sm">
            Toca el centro para girar
          </p>
        </div>
        <span aria-hidden style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }} />
      </header>

      <RuletaGameView />
    </div>
  );
}
