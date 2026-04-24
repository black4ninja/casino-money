import type { ReactNode } from "react";
import { BancaSabeBoard } from "../BancaSabeBoard";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";

/**
 * Narrative rules content for La Banca Sabe. Reusable entre la página
 * /juegos/banca-sabe/reglas y el tab "Reglas" de la mesa del dealer /
 * del jugador. No incluye header / back button — eso lo pone el host.
 *
 * La banca sabe no tiene rueda digital: sólo reglas + paso a paso +
 * tabla de pagos. El flujo de "pagar" (el dealer ajusta el saldo de
 * un jugador) vive fuera de este componente, en el tab "Pagar" de la
 * mesa del dealer.
 */
export function BancaSabeReglasContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="El tablero"
        title="Así se ve la mesa del dealer"
        description="Tres zonas de apuesta. Cada zona evalúa algo distinto sobre lo que el dealer dice y lo que la carta realmente es."
      >
        <p className="mb-2 text-xs text-[--color-cream]/50 sm:hidden">
          ← desliza para ver el tablero completo →
        </p>
        <BancaSabeBoard />
      </Section>

      <Section
        label="Reglas de la ronda"
        title="Qué hace el dealer, qué hacen los jugadores"
        description="La mecánica central: el dealer tiene que mezclar verdades y mentiras para mantener la incertidumbre."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🃏">
              El dealer tiene todas las cartas de patrones de diseño y
              <strong> roba la de hasta arriba</strong>. La lee sólo él, en
              silencio.
            </NoteItem>
            <NoteItem icon="🗣️">
              Anuncia una <strong>categoría</strong>: <em>Creacional</em>,{" "}
              <em>Estructural</em> o <em>Comportamiento</em>. Puede decir la
              verdadera… o mentir. Es su decisión.
            </NoteItem>
            <NoteItem icon="🪙">
              El dealer también puede apostar en el tablero junto con los
              jugadores antes de revelar la carta.
            </NoteItem>
            <NoteItem icon="🔒">
              Una vez que alguien pone ficha, el dealer{" "}
              <strong>no puede cambiar su anuncio</strong>.
            </NoteItem>
            <NoteItem icon="👀">
              Si los jugadores lo cachan mintiendo seguido, el dealer{" "}
              <strong>pierde credibilidad</strong> para las siguientes rondas —
              eso es parte del juego.
            </NoteItem>
          </ul>

          <div className="mt-5 rounded-lg bg-[--color-gold-500]/10 p-4 ring-1 ring-inset ring-[--color-gold-500]/30">
            <p className="font-label text-xs tracking-widest text-[--color-gold-300] sm:text-sm">
              La tensión central
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/85">
              Si el dealer siempre dice verdad, todos le creen y ganan fácil.
              Si siempre miente, los jugadores aprenden y apuestan{" "}
              <Badge tone="danger">MENTIRA</Badge> siempre. El dealer tiene
              que <strong>mezclar</strong> para mantener la incertidumbre.
            </p>
          </div>
        </Card>
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso de la ronda"
        description="Desde que el dealer baraja hasta el pago final."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🃏"
            title="El dealer baraja y roba la carta"
            body={
              <p>
                El dealer revuelve el mazo de patrones y roba la carta de
                mero arriba. La lee <strong>solo él</strong>, sin mostrarla
                a nadie.
              </p>
            }
          />

          <StepCard
            n={2}
            icon="🗣️"
            title="Anuncia una categoría"
            body={
              <>
                <p>
                  El dealer dice en voz alta qué categoría dice que es la
                  carta: <Badge tone="gold">Creacional</Badge>{" "}
                  <Badge tone="info">Estructural</Badge>{" "}
                  <Badge tone="danger">Comportamiento</Badge>.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/70">
                  Puede decir la verdad o mentir — es su decisión — pero no
                  puede cambiar el anuncio una vez que empiezan las apuestas.
                </p>
              </>
            }
          />

          <StepCard
            n={3}
            icon="🪙"
            title="Los jugadores apuestan"
            body={
              <>
                <p className="mb-3">
                  Con el anuncio ya hecho, cada jugador coloca sus fichas en
                  las zonas del tablero según lo que quiera creer:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BetTile
                    name="Zona 1 — Verdad / Mentira"
                    where="¿Le crees al dealer?"
                    pays="1:1 · 2:1"
                    detail="VERDAD paga 1:1 (la apuesta más cómoda); MENTIRA paga 2:1 (si cachaste al dealer)."
                    accent="felt"
                  />
                  <BetTile
                    name="Zona 2 — Categoría real"
                    where="Independiente de lo que dijo el dealer"
                    pays="4:1 / 3:1 / 2:1"
                    detail="Apuestas a qué es realmente la carta. Creacional paga más porque hay menos cartas; Comportamiento menos porque hay más."
                    accent="info"
                  />
                  <BetTile
                    name="Zona 3 — Pleno"
                    where="Nombra el patrón exacto"
                    pays="10:1"
                    detail="Se dice el nombre en voz alta antes de revelar — no se escribe. La apuesta más arriesgada."
                    accent="gold"
                  />
                </div>
                <p className="mt-3 rounded-lg bg-[--color-gold-500]/10 p-3 text-xs leading-relaxed text-[--color-cream]/75 ring-1 ring-inset ring-[--color-gold-500]/30 sm:text-sm">
                  <strong className="text-[--color-gold-300]">Ojo:</strong>{" "}
                  las zonas son independientes. Puedes apostar a VERDAD en
                  Zona 1 y a la categoría contraria en Zona 2 — se pagan por
                  separado.
                </p>
              </>
            }
          />

          <StepCard
            n={4}
            icon="🎯"
            title="El dealer también puede apostar"
            body={
              <p>
                Antes de revelar, el dealer puede poner sus propias fichas
                sobre el tablero junto con los jugadores. Es la parte
                interesante: su apuesta deja pistas sobre si estaba diciendo
                la verdad… o sobre cómo quiere que lo interpreten.
              </p>
            }
          />

          <StepCard
            n={5}
            icon="🔓"
            title="Se revela la carta"
            body={
              <p>
                Cuando todas las fichas están puestas, el dealer voltea la
                carta. Se leen en voz alta el <strong>patrón exacto</strong>{" "}
                y su <strong>categoría real</strong>.
              </p>
            }
          />

          <StepCard
            n={6}
            icon="💰"
            title="Se pagan las apuestas"
            body={
              <>
                <p className="mb-3">Cada zona se evalúa por separado:</p>
                <ul className="flex flex-col gap-1.5 text-sm text-[--color-cream]/85">
                  <BulletLine marker="●" markerColor="text-[--color-gold-300]">
                    <strong>Zona 1:</strong> gana VERDAD si el dealer dijo
                    la categoría correcta; gana MENTIRA si mintió.
                  </BulletLine>
                  <BulletLine marker="●" markerColor="text-[--color-gold-300]">
                    <strong>Zona 2:</strong> gana la casilla que coincide
                    con la categoría real de la carta.
                  </BulletLine>
                  <BulletLine marker="●" markerColor="text-[--color-gold-300]">
                    <strong>Zona 3:</strong> gana quien haya nombrado el
                    patrón exacto <em>antes</em> de la revelación.
                  </BulletLine>
                </ul>
                <p className="mt-3 text-xs text-[--color-cream]/65">
                  El dealer retira las fichas perdedoras y paga las
                  ganadoras desde la caja.
                </p>
              </>
            }
          />

          <StepCard
            n={7}
            icon="🔁"
            title="Siguiente ronda"
            body={
              <p>
                El dealer baraja (o simplemente mueve la carta revelada al
                fondo del mazo) y empieza una nueva ronda. La credibilidad
                que el dealer gane o pierda en una ronda se arrastra — es
                parte de por qué el juego se pone más interesante conforme
                avanza la mesa.
              </p>
            }
          />
        </ol>
      </Section>

      <Section
        label="Referencia"
        title="Tabla de pagos"
        description="Todo lo que paga la banca en una sola vista."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PayoutChip
            label="Verdad"
            sub="Zona 1 · el dealer dijo la correcta"
            pays="1 : 1"
            tone="felt"
          />
          <PayoutChip
            label="Mentira"
            sub="Zona 1 · el dealer mintió"
            pays="2 : 1"
            tone="danger"
          />
          <PayoutChip
            label="Creacional"
            sub="Zona 2 · 5 patrones"
            pays="4 : 1"
            tone="gold"
          />
          <PayoutChip
            label="Estructural"
            sub="Zona 2 · 7 patrones"
            pays="3 : 1"
            tone="info"
          />
          <PayoutChip
            label="Comportamiento"
            sub="Zona 2 · 11 patrones"
            pays="2 : 1"
            tone="danger"
          />
          <PayoutChip
            label="Pleno"
            sub="Zona 3 · nombre exacto"
            pays="10 : 1"
            tone="gold"
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
            <NoteItem icon="🎭">
              <strong>Credibilidad:</strong> el dealer gana o pierde
              credibilidad a lo largo de la noche según qué tan seguido lo
              cachen mintiendo. Eso cambia cómo apuestan los jugadores en
              las siguientes rondas.
            </NoteItem>
            <NoteItem icon="🗯️">
              <strong>Pleno en voz alta:</strong> la Zona 3 se dice hablando,
              no se escribe. Esto permite que otros jugadores escuchen y
              decidan si arriesgan también.
            </NoteItem>
            <NoteItem icon="♟️">
              <strong>Apuestas múltiples:</strong> un jugador puede tener
              fichas en las tres zonas al mismo tiempo; cada una se evalúa
              por separado.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> quedan a discreción del
              dealer según las fichas disponibles de la sesión.
            </NoteItem>
          </ul>
        </Card>
      </Section>
    </main>
  );
}

/* ---------- Layout helpers locales ---------- */

function PullQuote() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[--color-smoke-800] to-[--color-felt-900] p-5 shadow-[0_8px_28px_rgba(0,0,0,0.4)] ring-2 ring-inset ring-[--color-gold-500]/40 sm:p-8">
      <p className="font-label text-xs tracking-[0.3em] text-[--color-gold-300] sm:text-sm">
        En una frase
      </p>
      <p className="mt-2 font-display text-lg leading-snug text-[--color-ivory] sm:mt-3 sm:text-xl md:text-2xl">
        El dealer roba una carta, anuncia una{" "}
        <span className="text-[--color-gold-300]">categoría</span> — verdad o
        mentira — y los jugadores apuestan en tres zonas: creerle, adivinar
        la categoría real, o nombrar el patrón exacto.
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
}: {
  label: string;
  sub: string;
  pays: string;
  tone: "gold" | "info" | "danger" | "felt";
}) {
  const TONE_BORDER: Record<typeof tone, string> = {
    gold: "border-[--color-gold-500]/60",
    info: "border-[--color-chip-blue-400]/60",
    danger: "border-[--color-chip-red-400]/60",
    felt: "border-[--color-felt-500]/60",
  };
  const TONE_TEXT: Record<typeof tone, string> = {
    gold: "text-[--color-gold-300]",
    info: "text-[--color-chip-blue-300]",
    danger: "text-[--color-chip-red-300]",
    felt: "text-[--color-cream]",
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
          TONE_TEXT[tone],
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
