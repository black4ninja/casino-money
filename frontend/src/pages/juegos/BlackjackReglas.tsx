import { Link } from "react-router-dom";
import { BlackjackReglasContent } from "@/components/organisms/games/BlackjackReglasContent";

/**
 * Standalone page for /juegos/blackjack/reglas. Thin wrapper — el
 * contenido narrativo vive en <BlackjackReglasContent /> y se reutiliza
 * también desde los tabs "Reglas" del dealer y del jugador.
 */
export default function BlackjackReglas() {
  return (
    <div
      style={{
        paddingTop: "3rem",
        marginTop: "1rem",
        paddingLeft: "2rem",
        paddingRight: "2rem",
        marginLeft: "1rem",
        marginRight: "1rem",
      }}
      className="min-h-screen pb-6 sm:pb-8 lg:pb-10"
    >
      <header style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
          <h1 className="gold-shine font-display text-2xl leading-none sm:text-3xl md:text-4xl">
            Reglas · Blackjack
          </h1>
          <p className="mt-1 font-label text-[10px] tracking-[0.25em] text-[--color-cream]/70 sm:text-xs">
            Cómo se juega paso a paso
          </p>
        </div>
        <span aria-hidden style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }} />
      </header>

      <div className="mt-6 sm:mt-10">
        <BlackjackReglasContent />
      </div>
    </div>
  );
}
