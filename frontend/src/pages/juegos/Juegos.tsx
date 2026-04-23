import { Link } from "react-router-dom";
import { Card } from "@/components/atoms/Card";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { GAMES, type Game } from "@/domain/games";

export default function Juegos() {
  return (
    <div
      style={{
        paddingTop: "3rem",
        marginTop: "1rem",
        paddingLeft: "2rem",
        paddingRight: "2rem",
        marginLeft: "1rem",
        marginRight: "1rem",
        paddingBottom: "5rem",
        marginBottom: "2rem",
      }}
      className="min-h-screen"
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <Link
          to="/"
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
            Juegos
          </h1>
          <p className="mt-1 font-label text-[10px] tracking-[0.25em] text-[--color-cream]/70 sm:text-xs">
            Elige un juego para ver sus reglas o abrirlo
          </p>
        </div>
        <span aria-hidden style={{ width: "2.5rem", height: "2.5rem", flexShrink: 0 }} />
      </header>

      <main className="mx-auto mt-6 flex w-full max-w-5xl flex-col gap-8 sm:mt-10">
        <div className="grid gap-5 sm:grid-cols-2">
          {GAMES.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </main>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const hasDigital = !!game.digitalPath;
  return (
    <Card className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-4">
        <span className="gold-shine font-display text-4xl leading-none">
          {game.emoji}
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl text-[--color-ivory]">
              {game.name}
            </h2>
            {hasDigital ? (
              <Badge tone="success">Digital disponible</Badge>
            ) : (
              <Badge tone="neutral">Solo físico</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-[--color-cream]/75">
            {game.description}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap gap-3">
        {game.rulesPath && (
          <Link to={game.rulesPath}>
            <Button variant="ghost" size="sm">
              Ver reglas
            </Button>
          </Link>
        )}
        {hasDigital && (
          <Link to={game.digitalPath!}>
            <Button variant="gold" size="sm">
              Jugar
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
