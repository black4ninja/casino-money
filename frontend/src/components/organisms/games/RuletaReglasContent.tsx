import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { RouletteBoard } from "../RouletteBoard";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";
import { Button } from "../../atoms/Button";
import { PAYOUTS } from "@/domain/designPatterns";
import { findGame } from "@/domain/games";

const ruleta = findGame("ruleta")!;

type Props = {
  /** When true, hide the "Abrir la rueda digital" CTA at the bottom — the
   *  host already IS the digital view (e.g. dealer mesa tab). */
  hideDigitalCTA?: boolean;
};

/**
 * Narrative rules content for the Ruleta de Patrones. Reusable across
 * the standalone /juegos/ruleta/reglas page and the dealer mesa "Reglas"
 * tab. Does NOT include page-level header/back button — host provides those.
 */
export function RuletaReglasContent({ hideDigitalCTA }: Props = {}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="El tablero"
        title="Así se ve el tablero físico"
        description="Cada jugador coloca fichas sobre las casillas antes del giro. La rueda digital decide el patrón ganador."
      >
        <p className="mb-2 text-xs text-[--color-cream]/50 sm:hidden">
          ← desliza para ver el tablero completo →
        </p>
        <RouletteBoard />
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso"
        description="Desde que entras a la mesa hasta el pago final, en 6 pasos."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🎯"
            title="Entiende el tablero"
            body={
              <>
                <p>
                  El tablero tiene <strong>23 casillas numeradas</strong>, una
                  por patrón, agrupadas por categoría GoF:
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-sm text-[--color-cream]/85">
                  <li className="flex flex-wrap items-center gap-2">
                    <Badge tone="gold">Creacional</Badge>
                    <span>
                      casillas <strong>1 a 5</strong> · 5 patrones
                    </span>
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">Estructural</Badge>
                    <span>
                      casillas <strong>6 a 12</strong> · 7 patrones
                    </span>
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <Badge tone="danger">Comportamiento</Badge>
                    <span>
                      casillas <strong>13 a 23</strong> · 11 patrones
                    </span>
                  </li>
                </ul>
                <p className="mt-3">
                  Arriba del tablero hay una casilla especial{" "}
                  <Badge tone="success">0 — Comodín</Badge> que representa la
                  ventaja de la casa.
                </p>
              </>
            }
          />

          <StepCard
            n={2}
            icon="🪙"
            title="Coloca tus apuestas"
            body={
              <>
                <p className="mb-3">
                  Antes de que el dealer gire la rueda, cada jugador coloca sus
                  fichas sobre las casillas que quiera apostar. Puedes combinar
                  varias apuestas en la misma ronda.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BetTile
                    name="Pleno"
                    where="Una casilla numerada (1–23)"
                    pays={`${PAYOUTS.pleno}:1`}
                    detail="La apuesta más arriesgada; paga más."
                    accent="gold"
                  />
                  <BetTile
                    name="Categoría"
                    where="Recuadro de Creacional / Estructural / Comportamiento"
                    pays={`${PAYOUTS.creational}:1 · ${PAYOUTS.structural}:1 · ${PAYOUTS.behavioral}:1`}
                    detail="Ganas si cae cualquier patrón de esa categoría."
                    accent="info"
                  />
                  <BetTile
                    name="Combinada"
                    where="Crea + Est  ·  Est + Comp"
                    pays={`${PAYOUTS.creaEst}:1`}
                    detail="Estilo rojo/negro: cubren aproximadamente la mitad del tablero."
                    accent="felt"
                  />
                  <BetTile
                    name="Top 5 GoF"
                    where="Recuadro Top 5 GoF"
                    pays={`${PAYOUTS.top5}:1`}
                    detail="Los 5 patrones que el dealer marca como los más usados."
                    accent="gold"
                  />
                </div>
                <p className="mt-3 rounded-lg bg-[--color-gold-500]/10 p-3 text-xs leading-relaxed text-[--color-cream]/75 ring-1 ring-inset ring-[--color-gold-500]/30 sm:text-sm">
                  <strong className="text-[--color-gold-300]">Tip:</strong> los
                  pagos son desiguales a propósito. Apostar a{" "}
                  <em>Comportamiento</em> es más seguro (11 de 23 patrones) y
                  por eso paga menos; apostar a un <em>Pleno</em> es improbable
                  pero paga mucho más.
                </p>
              </>
            }
          />

          <StepCard
            n={3}
            icon="🎡"
            title="El dealer gira la rueda"
            body={
              <>
                <p>
                  Cuando todos terminan de apostar, el dealer toca el centro de
                  la rueda digital. La rueda gira aproximadamente{" "}
                  <strong>10 segundos</strong> y aterriza en un resultado.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/60">
                  Una vez que comienza el giro, no se pueden mover las fichas.
                </p>
              </>
            }
          />

          <StepCard
            n={4}
            icon="🎉"
            title="Se revela el ganador"
            body={
              <p>
                La pantalla muestra el nombre del patrón y su categoría con una
                animación de victoria. Ese patrón es el que decide qué apuestas
                se pagan.
              </p>
            }
          />

          <StepCard
            n={5}
            icon="💰"
            title="Pagar apuestas"
            body={
              <>
                <p className="mb-3">
                  Si la rueda cae en un número del <strong>1 al 23</strong>,
                  ganan:
                </p>
                <ul className="flex flex-col gap-1.5 text-sm text-[--color-cream]/85">
                  <BulletLine marker="●" markerColor="text-[--color-gold-300]">
                    Quien apostó al número exacto (Pleno · 22:1).
                  </BulletLine>
                  <BulletLine marker="●" markerColor="text-[--color-gold-300]">
                    Quien apostó a la categoría correcta (4:1 / 3:1 / 2:1 según
                    la categoría).
                  </BulletLine>
                  <BulletLine marker="●" markerColor="text-[--color-gold-300]">
                    Quien apostó a una combinación que incluye esa categoría
                    (1:1).
                  </BulletLine>
                  <BulletLine marker="●" markerColor="text-[--color-gold-300]">
                    Quien apostó al Top 5 GoF y el resultado está en la lista
                    del dealer (4:1).
                  </BulletLine>
                </ul>
                <div className="mt-4 rounded-lg bg-[--color-chip-green-500]/15 p-4 ring-2 ring-inset ring-[--color-chip-green-400]/60">
                  <p className="flex items-center gap-2 font-label text-xs tracking-widest text-[--color-chip-green-300]">
                    <Badge tone="success">0</Badge>
                    Si cae el Comodín
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[--color-cream]/85">
                    <BulletLine marker="✕" markerColor="text-[--color-chip-red-300]">
                      Todas las apuestas activas se pierden.
                    </BulletLine>
                    <BulletLine marker="★" markerColor="text-[--color-gold-300]">
                      <strong>Regla de rescate</strong>: el dealer lanza una
                      pregunta rápida sobre patrones. El primer jugador que
                      responda correctamente recupera sus fichas (sin ganancia,
                      pero sin pérdida).
                    </BulletLine>
                  </ul>
                </div>
              </>
            }
          />

          <StepCard
            n={6}
            icon="🔁"
            title="Siguiente ronda"
            body={
              <p>
                El dealer retira las fichas perdedoras, paga las ganadoras y
                comienza una nueva ronda. Cada ronda es independiente — los
                jugadores pueden cambiar de estrategia cada vez.
              </p>
            }
          />
        </ol>
      </Section>

      <Section
        label="Referencia"
        title="Tabla de pagos"
        description="Todo lo que paga el casino en una sola vista."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PayoutChip label="Pleno" sub="número exacto" pays="22 : 1" tone="gold" />
          <PayoutChip label="Creacional" sub="5 patrones" pays="4 : 1" tone="gold" />
          <PayoutChip label="Estructural" sub="7 patrones" pays="3 : 1" tone="info" />
          <PayoutChip label="Comportamiento" sub="11 patrones" pays="2 : 1" tone="danger" />
          <PayoutChip label="Crea + Est" sub="12 patrones" pays="1 : 1" tone="felt" />
          <PayoutChip label="Est + Comp" sub="18 patrones" pays="1 : 1" tone="felt" />
          <PayoutChip label="Top 5 GoF" sub="a elección del dealer" pays="4 : 1" tone="gold" />
          <PayoutChip
            label="0 Comodín"
            sub="si cae el cero"
            pays="todo se pierde"
            tone="success"
            danger
          />
        </div>
      </Section>

      <Section
        label="Detalles"
        title="Notas y variantes"
        description="Reglas de casa que el dealer puede ajustar según la sesión."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="👑">
              <strong>Top 5 GoF:</strong> el dealer decide qué 5 patrones forman
              la lista y puede cambiarlos entre rondas. Pregunta cuáles son
              antes de apostar.
            </NoteItem>
            <NoteItem icon="♜">
              <strong>Conflictos de apuesta:</strong> un mismo jugador puede
              tener varias apuestas activas; cada una se evalúa por separado.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> quedan a discreción del dealer
              según las fichas disponibles de la sesión.
            </NoteItem>
            <NoteItem icon="🎲">
              <strong>Sin digital:</strong> si no hay rueda digital disponible,
              el dealer puede usar un dado o cualquier generador aleatorio
              equivalente a 24 resultados (0–23).
            </NoteItem>
          </ul>
        </Card>
      </Section>

      {!hideDigitalCTA && ruleta.digitalPath && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "1rem",
            paddingBottom: "5rem",
            marginBottom: "2rem",
          }}
        >
          <Link to={ruleta.digitalPath}>
            <Button variant="gold" size="lg">
              Abrir la rueda digital
            </Button>
          </Link>
        </div>
      )}
    </main>
  );
}

/* ---------- Layout helpers local to this content ---------- */

function PullQuote() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[--color-smoke-800] to-[--color-felt-900] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.4)] ring-2 ring-inset ring-[--color-gold-500]/40 sm:p-8">
      <p className="font-label text-xs tracking-[0.3em] text-[--color-gold-300] sm:text-sm">
        En una frase
      </p>
      <p className="mt-2 font-display text-lg leading-snug text-[--color-ivory] sm:mt-3 sm:text-xl md:text-2xl">
        Los jugadores apuestan colocando fichas sobre un tablero de{" "}
        <span className="text-[--color-gold-300]">23 patrones</span> GoF. El
        dealer gira la rueda, ésta aterriza en un patrón, y se pagan las
        apuestas ganadoras según el tipo de apuesta.
      </p>
    </section>
  );
}

function Section({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-px flex-1 bg-gradient-to-r from-transparent via-[--color-gold-500]/60 to-transparent"
          />
          <span className="font-label text-xs tracking-[0.28em] text-[--color-gold-300] sm:text-sm sm:tracking-[0.3em]">
            {label}
          </span>
          <span
            aria-hidden
            className="h-px flex-1 bg-gradient-to-r from-transparent via-[--color-gold-500]/60 to-transparent"
          />
        </div>
        <h2 className="gold-shine text-center font-display text-2xl sm:text-2xl md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mx-auto max-w-xl text-center text-sm text-[--color-cream]/70 sm:text-sm md:text-base">
            {description}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}

function StepCard({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: string;
  title: string;
  body: ReactNode;
}) {
  return (
    <li className="relative rounded-2xl bg-[--color-smoke-800]/80 p-5 shadow-[0_6px_20px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-[--color-gold-500]/20 sm:p-7 lg:p-8">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[--color-gold-300] to-[--color-gold-500] font-display text-lg font-black text-[--color-smoke] shadow-[0_3px_0_#8a6a10,0_5px_10px_rgba(0,0,0,0.4)] sm:h-12 sm:w-12 sm:text-lg">
          {n}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-lg sm:text-xl">
              {icon}
            </span>
            <h3 className="font-display text-lg leading-tight text-[--color-ivory] sm:text-xl">
              {title}
            </h3>
          </div>
          <div className="mt-2 space-y-2 text-sm leading-relaxed text-[--color-cream]/85 sm:text-base">
            {body}
          </div>
        </div>
      </div>
    </li>
  );
}

function BetTile({
  name,
  where,
  pays,
  detail,
  accent,
}: {
  name: string;
  where: string;
  pays: string;
  detail: string;
  accent: "gold" | "info" | "felt";
}) {
  const ACCENT_BORDER: Record<typeof accent, string> = {
    gold: "border-[--color-gold-500]",
    info: "border-[--color-chip-blue-400]",
    felt: "border-[--color-felt-500]",
  };
  return (
    <div
      className={[
        "rounded-lg border-l-4 bg-black/30 py-4 pl-5 pr-4 sm:py-5 sm:pl-7 sm:pr-5",
        ACCENT_BORDER[accent],
      ].join(" ")}
    >
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <p className="font-display text-base text-[--color-ivory] sm:text-base">
          {name}
        </p>
        <p className="font-label text-xs tracking-widest text-[--color-gold-300] sm:text-sm">
          {pays}
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[--color-cream]/75 sm:text-sm">
        {where}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/60 sm:text-sm">
        {detail}
      </p>
    </div>
  );
}

function PayoutChip({
  label,
  sub,
  pays,
  tone,
  danger,
}: {
  label: string;
  sub: string;
  pays: string;
  tone: "gold" | "info" | "danger" | "felt" | "success";
  danger?: boolean;
}) {
  const TONE_BORDER: Record<typeof tone, string> = {
    gold: "border-[--color-gold-500]/60",
    info: "border-[--color-chip-blue-400]/60",
    danger: "border-[--color-chip-red-400]/60",
    felt: "border-[--color-felt-500]/60",
    success: "border-[--color-chip-green-400]/60",
  };
  const TONE_TEXT: Record<typeof tone, string> = {
    gold: "text-[--color-gold-300]",
    info: "text-[--color-chip-blue-300]",
    danger: "text-[--color-chip-red-300]",
    felt: "text-[--color-cream]",
    success: "text-[--color-chip-green-300]",
  };
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 rounded-xl border-l-4 bg-[--color-smoke-800]/70 py-4 pl-5 pr-4 shadow-[0_3px_10px_rgba(0,0,0,0.3)] sm:py-4 sm:pl-7 sm:pr-5",
        TONE_BORDER[tone],
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate font-display text-base text-[--color-ivory] sm:text-base">
          {label}
        </p>
        <p className="truncate font-label text-xs tracking-widest text-[--color-cream]/60">
          {sub}
        </p>
      </div>
      <p
        className={[
          "shrink-0 font-label text-xs tracking-widest sm:text-sm",
          danger ? "text-[--color-chip-red-300]" : TONE_TEXT[tone],
        ].join(" ")}
      >
        {pays}
      </p>
    </div>
  );
}

function NoteItem({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden className="text-lg leading-tight shrink-0">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

function BulletLine({
  marker,
  markerColor,
  children,
}: {
  marker: string;
  markerColor: string;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className={["shrink-0 font-mono", markerColor].join(" ")}>
        {marker}
      </span>
      <span className="flex-1">{children}</span>
    </li>
  );
}
