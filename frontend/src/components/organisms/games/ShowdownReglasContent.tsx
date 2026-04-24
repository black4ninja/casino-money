import type { ReactNode } from "react";
import { ShowdownBoard } from "../ShowdownBoard";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";

/**
 * Narrative rules content para Showdown de Patrones. Reutilizable entre
 * la página /juegos/showdown/reglas y los tabs "Reglas" de dealer /
 * jugador. El juego no tiene jugabilidad digital — el dealer reparte y
 * revela; el pago se hace desde el tab "Pagar".
 */
export function ShowdownReglasContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="El tablero"
        title="Así se ve la mesa"
        description="Escenario al centro, pozo y descarte a un lado, tres fases de apuesta y el showdown con argumentación + veredicto."
      >
        <p className="mb-2 text-xs text-[--color-cream]/50 sm:hidden">
          ← desliza para ver la mesa completa →
        </p>
        <ShowdownBoard />
      </Section>

      <Section
        label="Reglas clave"
        title="Una carta, un escenario, mucho argumento"
        description="Sólo tienes 1 carta privada. El escenario lo ven todos. Ganas si convences al grupo de que tu patrón resuelve mejor."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🂠">
              <strong>Una carta privada:</strong> cada jugador recibe{" "}
              <strong>1 patrón boca abajo</strong>. Es la única carta con
              la que vas a argumentar.
            </NoteItem>
            <NoteItem icon="🎯">
              <strong>Un escenario abierto:</strong> el dealer voltea{" "}
              <strong>1 carta al centro</strong> — visible para todos. Ese
              es el problema contra el que cada quien peleará con su
              patrón.
            </NoteItem>
            <NoteItem icon="💸">
              <strong>Blind obligatorio:</strong> después de ver tu carta,
              pagas la apuesta mínima para seguir en la 1ª ronda.
            </NoteItem>
            <NoteItem icon="🔁">
              <strong>Descarte:</strong> si tu carta no va bien con el
              escenario, puedes pagar <strong>1 ficha al pozo</strong>{" "}
              para cambiarla. Solo <strong>1 vez por ronda</strong>.
            </NoteItem>
            <NoteItem icon="🏳️">
              <strong>Retiro:</strong> puedes salirte antes del showdown
              y perder <em>solo</em> lo que ya apostaste. Si nadie más
              sigue, el último que quedó gana <strong>sin argumentar</strong>.
            </NoteItem>
            <NoteItem icon="🗳️">
              <strong>Voto del grupo:</strong> en el showdown todos
              argumentan 45 segundos y el grupo vota. Mayoría simple; en
              empate decide el dealer.
            </NoteItem>
          </ul>

          <div className="mt-5 rounded-lg bg-[--color-gold-500]/10 p-4 ring-1 ring-inset ring-[--color-gold-500]/30">
            <p className="font-label text-[10px] tracking-widest text-[--color-gold-300] sm:text-xs">
              Ritmo de mesa
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/85">
              Una ronda completa toma <strong>4–5 minutos</strong>. Caben{" "}
              <strong>3–4 rondas</strong> en una sesión de 20 minutos.
            </p>
          </div>
        </Card>
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso de la ronda"
        description="Desde el reparto hasta la votación, en 9 pasos."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🂠"
            title="Reparto"
            body={
              <p>
                El dealer reparte <strong>1 carta de patrón boca abajo</strong>{" "}
                a cada jugador. Sólo tú la ves.
              </p>
            }
          />

          <StepCard
            n={2}
            icon="🎯"
            title="Sale el escenario"
            body={
              <p>
                El dealer voltea <strong>1 carta de escenario</strong> al
                centro de la mesa — visible para todos. Define el problema
                que cada jugador tendrá que argumentar que su patrón
                resuelve.
              </p>
            }
          />

          <StepCard
            n={3}
            icon="👀"
            title="Revisa tu carta en secreto"
            body={
              <p>
                Cada jugador ve su carta privada sin mostrarla. Piensa qué
                tan bien encaja tu patrón contra el escenario que ya está
                arriba.
              </p>
            }
          />

          <StepCard
            n={4}
            icon="💸"
            title="1ª ronda de apuestas"
            body={
              <>
                <p>
                  <Badge tone="gold">Blind</Badge> obligatorio para seguir
                  en la ronda. Apuesta, iguala o retírate — si te retiras
                  aquí pierdes solo lo ya apostado.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tip: si tu carta no va, vale la pena esperar al descarte
                  antes de retirarte.
                </p>
              </>
            }
          />

          <StepCard
            n={5}
            icon="🔁"
            title="Fase de descarte"
            body={
              <>
                <p>
                  Quien quiera paga <strong>1 ficha al pozo</strong> y
                  cambia su carta. Es <strong>opcional</strong> y{" "}
                  <strong>solo 1 vez por ronda</strong>. Si te sientes
                  cómodo con tu carta, saltas este paso.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  El dealer toma la carta descartada y te entrega una
                  nueva del mazo, boca abajo.
                </p>
              </>
            }
          />

          <StepCard
            n={6}
            icon="🔥"
            title="2ª ronda de apuestas"
            body={
              <p>
                La apuesta final antes del showdown. Puedes{" "}
                <strong>subir</strong> o <strong>igualar</strong>, e
                incluso ir <strong>all-in</strong> para presionar al
                resto a retirarse. Si todos se retiran menos uno, ese
                jugador <strong>gana sin argumentar</strong>.
              </p>
            }
          />

          <StepCard
            n={7}
            icon="❌"
            title="Quien se retiró en ambas rondas queda fuera"
            body={
              <p>
                El pozo queda intacto; las fichas que apostaron los
                retirados ya se quedaron ahí. Sólo siguen los que llegaron
                hasta el final.
              </p>
            }
          />

          <StepCard
            n={8}
            icon="🂡"
            title="Showdown — revelan y argumentan"
            body={
              <>
                <p className="mb-3">
                  Todos los jugadores activos voltean su carta{" "}
                  <strong>al mismo tiempo</strong>. Luego cada uno tiene{" "}
                  <strong>45 segundos</strong> para argumentar por qué su
                  patrón resuelve el escenario mejor que los demás.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BetTile
                    name="Argumento directo"
                    where="Tu patrón encaja con el escenario"
                    pays="fuerte para ganar"
                    detail="Cita el problema del escenario y cómo la intención del patrón lo resuelve — una propuesta limpia gana votos."
                    accent="gold"
                  />
                  <BetTile
                    name="Argumento creativo"
                    where="Tu patrón no es el obvio"
                    pays="puede robar votos"
                    detail="Si logras justificar un ángulo que el grupo no había visto, el voto puede voltearse — es la parte divertida del juego."
                    accent="felt"
                  />
                </div>
              </>
            }
          />

          <StepCard
            n={9}
            icon="🗳️"
            title="Voto del grupo"
            body={
              <p>
                El grupo vota levantando la mano. <strong>Mayoría simple</strong> gana;
                en empate el <strong>dealer decide</strong>. El ganador se
                lleva el <strong>pozo completo</strong> — el dealer le
                transfiere las fichas desde el tab <em>Pagar</em>.
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
            <NoteItem icon="🎴">
              <strong>Escenario por ronda:</strong> cada ronda arranca
              con un escenario nuevo. El mazo de escenarios es distinto
              del mazo de patrones.
            </NoteItem>
            <NoteItem icon="⏱️">
              <strong>Los 45 seg son sugeridos:</strong> el dealer puede
              extenderlos si hay mucho ida-y-vuelta o acortarlos si la
              mesa está yendo rápido.
            </NoteItem>
            <NoteItem icon="🏳️">
              <strong>Retiro temprano:</strong> si todos se retiran
              excepto uno en cualquier ronda, ese jugador se lleva el
              pozo sin llegar al showdown.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> el blind de la 1ª ronda
              y la apuesta máxima quedan a discreción del dealer según
              las fichas disponibles de la sesión.
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
        Cada jugador tiene <span className="text-[--color-gold-300]">1 carta privada</span>{" "}
        contra un escenario compartido; apuestan, pueden descartar una vez,
        apuestan otra vez, y al final <span className="text-[--color-gold-300]">argumentan</span>{" "}
        45 segundos para convencer al grupo.
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
