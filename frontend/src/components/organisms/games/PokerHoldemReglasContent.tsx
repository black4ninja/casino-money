import type { ReactNode } from "react";
import { PokerHoldemBoard } from "../PokerHoldemBoard";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";

/**
 * Narrative rules content for Poker Hold'em de Patrones. Reusable entre
 * la página /juegos/poker-holdem/reglas y los tabs de dealer/jugador.
 *
 * Poker Hold'em no tiene rueda/tablero digital jugable — sólo reglas
 * más el paso a paso de la ronda. El pago (entregar el pozo al ganador)
 * lo ejecuta el dealer desde el tab "Pagar" con la mecánica existente.
 */
export function PokerHoldemReglasContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="El tablero"
        title="Así se ve la mesa"
        description="Cinco cartas comunitarias en el escenario, el pozo al centro, 4 posiciones y 4 rondas de apuesta."
      >
        <p className="mb-2 text-xs text-[--color-cream]/50 sm:hidden">
          ← desliza para ver la mesa completa →
        </p>
        <PokerHoldemBoard />
      </Section>

      <Section
        label="Reglas clave"
        title="Las cartas, los blinds y el faroleo"
        description="La mecánica central: información oculta, apuesta obligatoria y un faroleo que puede ganar sin argumentar."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🂠">
              <strong>Las cartas privadas:</strong> cada jugador recibe{" "}
              <strong>2 patrones en secreto</strong>. Puedes usar uno o los
              dos en tu argumento final — usar los dos bien es como tener
              una mano fuerte.
            </NoteItem>
            <NoteItem icon="💸">
              <strong>Los blinds:</strong> J1 pone <em>small blind</em>{" "}
              obligatorio, J2 pone <em>big blind</em>. Esto asegura que
              siempre haya algo en el pozo aunque todos los demás se
              retiren.
            </NoteItem>
            <NoteItem icon="🎭">
              <strong>El faroleo:</strong> puedes apostar fuerte aunque tu
              patrón aplique apenas — si los demás se retiran, te llevas
              el pozo <strong>sin argumentar</strong>. Ese es el corazón
              del juego.
            </NoteItem>
            <NoteItem icon="🏳️">
              <strong>Retiro:</strong> puedes retirarte en cualquier ronda
              de apuesta y pierdes solo lo que llevas en el pozo. Si todos
              se retiran menos uno, ese jugador gana <em>sin showdown</em>.
            </NoteItem>
          </ul>

          <div className="mt-5 rounded-lg bg-[--color-gold-500]/10 p-4 ring-1 ring-inset ring-[--color-gold-500]/30">
            <p className="font-label text-[10px] tracking-widest text-[--color-gold-300] sm:text-xs">
              Ritmo de mesa
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/85">
              Una ronda toma <strong>7–8 minutos</strong> con 4 jugadores.
              Caben <strong>2–3 rondas</strong> en una sesión de 20 minutos.
            </p>
          </div>
        </Card>
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso de la ronda"
        description="Desde el reparto hasta la votación final, en 10 pasos."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🂠"
            title="Reparto"
            body={
              <p>
                El dealer reparte <strong>2 cartas de patrón boca abajo</strong>{" "}
                a cada jugador. Son privadas — sólo las ves tú.
              </p>
            }
          />

          <StepCard
            n={2}
            icon="💸"
            title="Pre-flop — apuesta ciega"
            body={
              <>
                <p>
                  Los blinds ya están puestos (<Badge tone="gold">J1 small</Badge>{" "}
                  <Badge tone="gold">J2 big</Badge>). Los demás apuestan{" "}
                  <strong>sin ver el escenario</strong>, solo con sus dos
                  cartas en mano.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>30 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={3}
            icon="🎴"
            title="El dealer revela el flop (F1 + F2 + F3)"
            body={
              <p>
                El dealer voltea las <strong>3 primeras cartas comunitarias</strong>{" "}
                al mismo tiempo. Todos leen y empiezan a mezclar esas cartas
                con las suyas para armar su argumento.
              </p>
            }
          />

          <StepCard
            n={4}
            icon="🪙"
            title="Post-flop — primera ronda real"
            body={
              <>
                <p>
                  Primera ronda de apuestas con información. Se decide quién
                  sigue, quién iguala y quién sube. Es donde se empieza a
                  leer el farol del otro.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>45 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={5}
            icon="🎴"
            title="El dealer revela el turn (T)"
            body={
              <p>
                Una carta más al escenario — <strong>la restricción técnica</strong>.
                Cambia el terreno: patrones que parecían fuertes dejan de
                aplicar y viceversa.
              </p>
            }
          />

          <StepCard
            n={6}
            icon="🔥"
            title="Post-turn — la apuesta más tensa"
            body={
              <>
                <p>
                  Con 4 cartas comunitarias y las privadas, los jugadores
                  tienen bastante información. Es la ronda donde más se
                  farolea y donde más gente se retira.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>30 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={7}
            icon="🎴"
            title="El dealer revela el river (R)"
            body={
              <p>
                Se voltea la <strong>última carta comunitaria</strong> — el
                giro final. Ya no hay más información nueva después de
                este momento.
              </p>
            }
          />

          <StepCard
            n={8}
            icon="💥"
            title="Post-river — apuesta final, pueden ir all-in"
            body={
              <>
                <p>
                  Ronda de apuesta final. Los jugadores pueden ir{" "}
                  <strong>all-in</strong> si quieren presionar a los demás
                  a retirarse.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>30 segundos</strong>.
                </p>
                <div className="mt-3 rounded-lg bg-[--color-chip-green-500]/10 p-3 ring-1 ring-inset ring-[--color-chip-green-400]/40">
                  <p className="text-[12px] leading-relaxed text-[--color-cream]/80">
                    Si quedan todos retirados menos uno,{" "}
                    <strong>gana sin showdown</strong> — no necesita
                    argumentar. Se embolsa el pozo completo.
                  </p>
                </div>
              </>
            }
          />

          <StepCard
            n={9}
            icon="🂡"
            title="Showdown — todos revelan simultáneo"
            body={
              <>
                <p className="mb-3">
                  Todos los jugadores activos voltean sus 2 cartas{" "}
                  <strong>al mismo tiempo</strong>. Luego cada uno tiene{" "}
                  <strong>45 segundos</strong> para argumentar su mano
                  contra las 5 comunitarias.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BetTile
                    name="Argumento fuerte"
                    where="Usa las 2 cartas privadas bien"
                    pays="gana normalmente"
                    detail="Combinación coherente con el flop/turn/river — lee bien la restricción."
                    accent="gold"
                  />
                  <BetTile
                    name="Faroleo"
                    where="Tus cartas apenas aplican"
                    pays="gana si el resto se retira"
                    detail="No tienes que mostrar nada si nadie quiso llegar al showdown."
                    accent="felt"
                  />
                </div>
              </>
            }
          />

          <StepCard
            n={10}
            icon="🗳️"
            title="El grupo vota al ganador"
            body={
              <p>
                Terminadas las argumentaciones, el grupo vota cuál fue la
                mejor mano. El <strong>ganador se lleva el pozo completo</strong>.
                El dealer le transfiere las fichas desde el tab{" "}
                <em>Pagar</em>.
              </p>
            }
          />
        </ol>
      </Section>

      <Section
        label="Detalles"
        title="Notas y variantes"
        description="Reglas de casa que el dealer puede ajustar según la sesión."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🔁">
              <strong>Rotación de blinds:</strong> los blinds avanzan una
              posición cada ronda — así todos pasan por small y big blind
              a lo largo de la sesión.
            </NoteItem>
            <NoteItem icon="⏱️">
              <strong>Los tiempos son sugeridos:</strong> el dealer puede
              acortarlos si la mesa está veloz o extenderlos si hay una
              discusión fuerte en la ronda.
            </NoteItem>
            <NoteItem icon="🧠">
              <strong>Usar 1 o 2 cartas privadas:</strong> en el showdown
              puedes apoyarte en solo una de las privadas si te conviene —
              no es obligatorio usar las dos.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> blinds y apuestas máximas
              quedan a discreción del dealer según las fichas disponibles
              de la sesión.
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
      <p className="font-label text-[10px] tracking-[0.3em] text-[--color-gold-300] sm:text-xs">
        En una frase
      </p>
      <p className="mt-2 font-display text-base leading-snug text-[--color-ivory] sm:mt-3 sm:text-xl md:text-2xl">
        Cada jugador recibe 2 cartas de patrón en secreto; se revelan 5
        cartas comunitarias en 3 rondas; se apuesta antes y después de
        cada revelación; al final, el grupo vota el{" "}
        <span className="text-[--color-gold-300]">mejor argumento</span>.
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
          <span className="font-label text-[10px] tracking-[0.28em] text-[--color-gold-300] sm:text-xs sm:tracking-[0.3em]">
            {label}
          </span>
          <span
            aria-hidden
            className="h-px flex-1 bg-gradient-to-r from-transparent via-[--color-gold-500]/60 to-transparent"
          />
        </div>
        <h2 className="gold-shine text-center font-display text-xl sm:text-2xl md:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mx-auto max-w-xl text-center text-xs text-[--color-cream]/70 sm:text-sm md:text-base">
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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[--color-gold-300] to-[--color-gold-500] font-display text-base font-black text-[--color-smoke] shadow-[0_3px_0_#8a6a10,0_5px_10px_rgba(0,0,0,0.4)] sm:h-12 sm:w-12 sm:text-lg">
          {n}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-base sm:text-xl">
              {icon}
            </span>
            <h3 className="font-display text-base leading-tight text-[--color-ivory] sm:text-xl">
              {title}
            </h3>
          </div>
          <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-[--color-cream]/85 sm:text-base">
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
      style={{
        paddingLeft: "2rem",
        paddingRight: "1.25rem",
        paddingTop: "1.25rem",
        paddingBottom: "1.25rem",
      }}
      className={[
        "rounded-lg border-l-4 bg-black/30",
        ACCENT_BORDER[accent],
      ].join(" ")}
    >
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <p className="font-display text-sm text-[--color-ivory] sm:text-base">
          {name}
        </p>
        <p className="font-label text-[10px] tracking-widest text-[--color-gold-300] sm:text-xs">
          {pays}
        </p>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[--color-cream]/70 sm:text-xs">
        {where}
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[--color-cream]/55 sm:text-xs">
        {detail}
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
