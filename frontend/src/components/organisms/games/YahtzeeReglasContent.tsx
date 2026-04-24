import type { ReactNode } from "react";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";

/**
 * Narrative rules content para Yahtzee de Patrones — la mesa festiva.
 * No hay tablero físico: el dealer improvisa mini retos con dados de
 * rol + d6 y pequeños retos del mundo real. Los jugadores que acierten
 * se llevan un d6 con letras; al cerrar las rondas, todos escriben
 * algo usando sus letras y el grupo vota el mejor escrito.
 *
 * A diferencia de las otras mesas, el flujo es deliberadamente abierto:
 * las reglas sientan el marco, pero cada ronda depende del dealer.
 */
export function YahtzeeReglasContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="Qué es"
        title="La mesa abierta del dealer"
        description="No hay tablero físico — el dealer propone los retos en vivo. La mesa gira alrededor de un premio: dados de 6 caras con letras que luego se usarán para escribir algo al final."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🎲">
              <strong>El material:</strong> dados de rol (d4, d6, d8,
              d10, d12, d20) + varios d6 normales + un set de{" "}
              <strong>d6 con letras</strong> que actúan como premios.
            </NoteItem>
            <NoteItem icon="🪙">
              <strong>Entrada variable:</strong> el dealer decide la
              apuesta mínima de entrada al pozo según la sesión. Puede
              cambiar entre rondas si tiene sentido.
            </NoteItem>
            <NoteItem icon="🎯">
              <strong>Cada ronda es un mini reto:</strong> el dealer
              propone un reto — con dados o con objetos del mundo real —
              y quien lo logre gana un <strong>d6 con letras</strong>{" "}
              para su caja personal.
            </NoteItem>
            <NoteItem icon="✍️">
              <strong>El cierre:</strong> cuando se acaban las rondas,
              cada jugador tira todos sus d6 de letras y escribe algo
              usando esas letras. El grupo vota el mejor escrito y el
              ganador se lleva el pozo.
            </NoteItem>
          </ul>

          <div className="mt-5 rounded-lg bg-[--color-gold-500]/10 p-4 ring-1 ring-inset ring-[--color-gold-500]/30">
            <p className="font-label text-[10px] tracking-widest text-[--color-gold-300] sm:text-xs">
              La consigna
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/85">
              La mesa donde <strong>menos aprendes pero más te diviertes</strong>.
              No hay acordeón ni evaluación técnica — el único criterio
              es lograr el reto o convencer al grupo en el escrito final.
            </p>
          </div>
        </Card>
      </Section>

      <Section
        label="Tipos de reto"
        title="Qué puede pedir el dealer"
        description="Hay dos familias de retos; el dealer alterna según el ritmo de la mesa."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ChallengeFamily
            title="Mini retos con dados"
            icon="🎲"
            bg="bg-[#1e1b4b]"
            examples={[
              {
                name: "Saca un número exacto",
                detail:
                  "Tira un d20 y consigue el número que el dealer dijo en voz alta.",
              },
              {
                name: "Suma a la consigna",
                detail:
                  "Con 3 d6 suma exactamente lo que el dealer pida antes de tirar.",
              },
              {
                name: "Yahtzee relámpago",
                detail:
                  "Tira 5 d6 y saca 3 iguales en 2 rondas de tiro — el dealer dicta cuántas rondas.",
              },
              {
                name: "Combo de rol",
                detail:
                  "Tira un d4 + d6 + d8 y pega una combinación pedida (ej. pares · números consecutivos · todos impares).",
              },
            ]}
          />
          <ChallengeFamily
            title="Mini retos del mundo real"
            icon="🌎"
            bg="bg-[#2a4820]"
            examples={[
              {
                name: "Tráeme algo",
                detail:
                  "El primero que regrese con el objeto pedido — una pluma, algo rojo, un chicle — se lleva el dado de letras.",
              },
              {
                name: "El detalle escondido",
                detail:
                  "Describe sin verla una cosa del salón (el color de la puerta, cuántas sillas hay). Aciertas, ganas.",
              },
              {
                name: "Prenda rápida",
                detail:
                  "Imita, canta o recita lo que el dealer pida. El grupo valida si fue suficiente.",
              },
              {
                name: "Cadena de palabras",
                detail:
                  "Di una palabra que empiece con la última letra que dijo el de tu izquierda — quien falle no gana la letra.",
              },
            ]}
          />
        </div>
        <p className="mt-3 rounded-lg bg-[--color-gold-500]/10 p-3 text-[12px] leading-relaxed text-[--color-cream]/75 ring-1 ring-inset ring-[--color-gold-500]/30 sm:text-sm">
          <strong className="text-[--color-gold-300]">Flexibilidad:</strong>{" "}
          los ejemplos son solo inspiración. El dealer puede inventar
          retos nuevos cada ronda — lo único fijo es que todos tengan la
          misma oportunidad de ganar la letra.
        </p>
      </Section>

      <Section
        label="El premio"
        title="La caja de letras"
        description="Cada reto ganado = 1 d6 con letras. Se acumulan durante toda la sesión y definen las herramientas para el escrito final."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🎁">
              <strong>1 reto = 1 dado:</strong> el ganador toma un d6
              con letras del montón y lo guarda en su caja personal
              (bolsita, vaso, lo que dé la mesa).
            </NoteItem>
            <NoteItem icon="🧠">
              <strong>Más letras = más opciones:</strong> al final del
              juego, cada jugador tira <em>todos</em> sus d6 de letras.
              Quien ganó más retos tira más dados y tiene más material
              para escribir.
            </NoteItem>
            <NoteItem icon="⚠️">
              <strong>Empate en un reto:</strong> si dos personas logran
              el reto casi al mismo tiempo, el dealer decide — o lanzan
              un d20 al aire y gana el más alto.
            </NoteItem>
          </ul>
        </Card>
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso de la ronda"
        description="Cada ronda es una unidad mínima — el dealer la abre, se resuelve y se reparte la letra."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🪙"
            title="Apuesta de entrada"
            body={
              <p>
                Todos los jugadores dejan su apuesta{" "}
                <strong>al pozo común</strong>. La cantidad la fija el
                dealer y puede variar por ronda si así lo decide —
                siempre que se avise antes.
              </p>
            }
          />

          <StepCard
            n={2}
            icon="🎤"
            title="El dealer anuncia el reto"
            body={
              <>
                <p>
                  El dealer describe el mini reto en voz alta — con
                  dados, del mundo real o mezcla. Explica el criterio
                  de victoria y el tiempo límite.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Si el reto involucra objetos o pruebas físicas, se
                  establece también el límite del espacio (hasta dónde
                  se puede buscar / moverse).
                </p>
              </>
            }
          />

          <StepCard
            n={3}
            icon="🏁"
            title="Todos compiten a la vez"
            body={
              <p>
                Los jugadores intentan lograr el reto al mismo tiempo.
                En retos de dados, tiran cuando el dealer diga{" "}
                <em>¡ya!</em>; en retos físicos, empieza la búsqueda o
                la ejecución.
              </p>
            }
          />

          <StepCard
            n={4}
            icon="🏆"
            title="Validación y entrega del dado"
            body={
              <>
                <p className="mb-3">
                  El dealer valida al ganador y le entrega{" "}
                  <strong>1 d6 con letras</strong> de la caja común.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <OutcomeTile
                    title="Alguien lo logra"
                    detail="Gana un d6 de letras. El pozo sigue acumulándose para el final."
                    tone="success"
                  />
                  <OutcomeTile
                    title="Nadie lo logra"
                    detail="Nadie se lleva letra esta ronda. El pozo queda igual y se pasa a la siguiente."
                    tone="neutral"
                  />
                </div>
              </>
            }
          />

          <StepCard
            n={5}
            icon="🔁"
            title="Siguiente ronda"
            body={
              <p>
                Se limpia la mesa, se invita a la siguiente apuesta de
                entrada y el dealer anuncia el siguiente reto. La mesa
                corre mientras haya energía — el dealer decide cuándo
                es el momento del cierre.
              </p>
            }
          />

          <StepCard
            n={6}
            icon="✍️"
            title="Cierre — el escrito con letras"
            body={
              <>
                <p className="mb-3">
                  Cuando termina la última ronda, cada jugador tira{" "}
                  <strong>todos sus d6 de letras</strong>. Con las
                  letras que salieron hacia arriba tiene que escribir
                  algo corto según la consigna del dealer.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ExampleTile
                    label="Consigna libre"
                    detail="Escribe una frase cualquiera usando al menos 4 de tus letras."
                  />
                  <ExampleTile
                    label="Consigna temática"
                    detail="Escribe un piropo, una disculpa exagerada, un titular de periódico falso — el dealer decide el tema."
                  />
                </div>
                <p className="mt-3 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>2 minutos</strong>. Más no
                  hace falta — la idea es que salga rápido y sea
                  divertido de leer.
                </p>
              </>
            }
          />

          <StepCard
            n={7}
            icon="🗳️"
            title="El grupo vota y paga el pozo"
            body={
              <>
                <p>
                  Cada jugador lee su escrito en voz alta. El grupo
                  vota <strong>levantando la mano</strong> — mayoría
                  simple — y en empate decide el dealer. El ganador se
                  lleva el <Badge tone="gold">pozo completo</Badge>.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  El dealer transfiere las fichas desde el tab{" "}
                  <em>Pagar</em>.
                </p>
              </>
            }
          />
        </ol>
      </Section>

      <Section
        label="Detalles"
        title="Notas y variantes"
        description="La mesa es flexible — estas son pistas para que el dealer la arme sobre la marcha."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🎛️">
              <strong>Cantidad de rondas:</strong> normalmente 6–10
              rondas según el aguante de la mesa. El dealer anuncia al
              inicio cuántas habrá o lo deja abierto.
            </NoteItem>
            <NoteItem icon="🎲">
              <strong>Entradas variables:</strong> el dealer puede subir
              la apuesta en rondas más difíciles (o reducirla para rondas
              de relleno). Tiene que anunciarse antes de iniciar el reto.
            </NoteItem>
            <NoteItem icon="🗣️">
              <strong>El escrito puede ser oral:</strong> si la mesa
              prefiere hablarlo en lugar de escribirlo, va. Lo importante
              es que use las letras que salieron en el tiro final.
            </NoteItem>
            <NoteItem icon="🎭">
              <strong>Tono:</strong> esta mesa no se evalúa con rúbrica
              — el ganador se define por diversión y consenso, no por
              precisión técnica. El dealer es moderador, no juez.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> todas las apuestas
              quedan a discreción del dealer según las fichas
              disponibles de la sesión.
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
        La mesa donde{" "}
        <span className="text-[--color-gold-300]">menos aprendes</span>{" "}
        pero{" "}
        <span className="text-[--color-gold-300]">más te diviertes</span>{" "}
        — mini retos con dados y del mundo real, un d6 con letras por
        reto ganado, y al final el mejor escrito se lleva el pozo.
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

function ChallengeFamily({
  title,
  icon,
  bg,
  examples,
}: {
  title: string;
  icon: string;
  bg: string;
  examples: { name: string; detail: string }[];
}) {
  return (
    <div
      className={[
        "rounded-2xl px-4 py-5 ring-1 ring-inset ring-[--color-gold-500]/40",
        bg,
      ].join(" ")}
    >
      <div className="mb-3 flex items-center gap-2">
        <span aria-hidden className="text-xl">
          {icon}
        </span>
        <p className="font-display text-base font-black text-[--color-ivory] sm:text-lg">
          {title}
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {examples.map((ex) => (
          <li
            key={ex.name}
            className="rounded-lg bg-black/25 px-3 py-2 ring-1 ring-inset ring-[--color-gold-500]/20"
          >
            <p className="font-display text-sm text-[--color-ivory]">
              {ex.name}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[--color-cream]/75">
              {ex.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OutcomeTile({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: "success" | "neutral";
}) {
  const TONE_BG: Record<typeof tone, string> = {
    success: "bg-[#1f4a2a]",
    neutral: "bg-[#1a1a1a]",
  };
  return (
    <div
      className={[
        "rounded-lg px-3 py-3 text-center ring-1 ring-inset ring-[--color-gold-500]/40",
        TONE_BG[tone],
      ].join(" ")}
    >
      <p className="font-display text-sm font-black tracking-wide text-[--color-ivory]">
        {title}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-[--color-cream]/80">
        {detail}
      </p>
    </div>
  );
}

function ExampleTile({
  label,
  detail,
}: {
  label: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg bg-black/30 px-3 py-3 ring-1 ring-inset ring-[--color-gold-500]/30">
      <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[--color-gold-300]/85">
        {label}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[--color-cream]/80">
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
