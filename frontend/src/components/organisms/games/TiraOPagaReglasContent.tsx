import type { ReactNode } from "react";
import { TiraOPagaBoard } from "../TiraOPagaBoard";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";

/**
 * Narrative rules content para Tira o Paga. Reutilizable entre la página
 * /juegos/tira-o-paga/reglas y los tabs "Reglas" de dealer / jugador.
 * El juego no tiene jugabilidad digital — el dealer opera el dado, las
 * apuestas y la evaluación; el pago sale del tab "Pagar".
 */
export function TiraOPagaReglasContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="El tablero"
        title="Así se ve la mesa"
        description="Cuatro pasos y una resolución. El lanzador elige, el dado decide, el dealer escoge el formato y todos compiten a la par."
      >
        <p className="mb-2 text-xs text-[--color-cream]/50 sm:hidden">
          ← desliza para ver la mesa completa →
        </p>
        <TiraOPagaBoard />
      </Section>

      <Section
        label="Reglas clave"
        title="El lanzador anuncia, todos compiten"
        description="No es resolver solo contra la casa — todos los jugadores tienen el mismo tiempo para resolver el mismo patrón. Gana el que termina primero y bien."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🎤">
              <strong>Jugador activo = lanzador:</strong> anuncia el patrón
              y la apuesta antes de tirar el dado. Pero no se resuelve solo
              — <strong>todos los jugadores</strong> compiten al mismo
              tiempo sobre ese patrón.
            </NoteItem>
            <NoteItem icon="🎲">
              <strong>El dado decide dificultad:</strong> Fácil ×2, Medio
              ×3, Difícil ×5. Nadie la controla — el lanzador apuesta
              antes sobre la dificultad que espera.
            </NoteItem>
            <NoteItem icon="🎯">
              <strong>Dos zonas de apuesta extra:</strong>{" "}
              <Badge tone="info">Zona 1</Badge> dificultad que crees que
              va a caer · <Badge tone="gold">Zona 2</Badge> tipo de reto
              que crees que va a elegir el dealer.
            </NoteItem>
            <NoteItem icon="⚖️">
              <strong>Riesgo del lanzador:</strong> gana si termina
              primero — pero si elige un patrón muy fácil todos lo conocen
              y la ventaja desaparece; si elige algo oscuro (Flyweight,
              Interpreter) se arriesga a que nadie lo resuelva y gane la
              casa.
            </NoteItem>
            <NoteItem icon="📝">
              <strong>Resuelven todos al tiempo:</strong> el lanzador
              también resuelve. Gana quien entrega la respuesta correcta
              completa más rápido. Empate = pozo dividido.
            </NoteItem>
          </ul>

          <div className="mt-5 rounded-lg bg-[--color-gold-500]/10 p-4 ring-1 ring-inset ring-[--color-gold-500]/30">
            <p className="font-label text-[10px] tracking-widest text-[--color-gold-300] sm:text-xs">
              Ritmo de mesa
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/85">
              Una ronda toma <strong>3–4 minutos</strong>. Caben{" "}
              <strong>10–12 rondas</strong> en una sesión de 40 minutos.
            </p>
          </div>
        </Card>
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso de la ronda"
        description="Nueve pasos — desde el anuncio hasta la rotación del siguiente lanzador."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🎤"
            title="El lanzador anuncia su patrón"
            body={
              <>
                <p>
                  En voz alta dice qué patrón quiere jugar. Una vez dicho,{" "}
                  <strong>no puede cambiarlo</strong>.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>10 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={2}
            icon="🪙"
            title="Todos apuestan simultáneamente"
            body={
              <>
                <p className="mb-3">
                  El lanzador pone su <strong>apuesta obligatoria</strong>{" "}
                  al pozo. Los demás pueden apostar en dos zonas:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BetTile
                    name="Zona 1 — Dificultad"
                    where="Apuestas a qué va a salir en el dado"
                    pays="paga al instante si aciertas"
                    detail="Fácil (1–2), Medio (3–4), Difícil (5–6). Cobran justo después del tiro."
                    accent="info"
                  />
                  <BetTile
                    name="Zona 2 — Tipo de reto"
                    where="Apuestas a lo que elige el dealer"
                    pays="paga al instante si aciertas"
                    detail="Participantes o Detecta el Error. Se resuelve después del Paso 4."
                    accent="gold"
                  />
                </div>
                <p className="mt-3 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>20 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={3}
            icon="🎲"
            title="El lanzador tira el dado"
            body={
              <>
                <p className="mb-3">
                  Todos ven qué dificultad cayó. Quienes apostaron a la
                  dificultad correcta en <Badge tone="info">Zona 1</Badge>{" "}
                  cobran inmediatamente.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <MultiplierTile
                    mult="×2"
                    label="Fácil"
                    note="nombrar · error obvio"
                    tone="success"
                  />
                  <MultiplierTile
                    mult="×3"
                    label="Medio"
                    note="roles · error sutil + corrección"
                    tone="warning"
                  />
                  <MultiplierTile
                    mult="×5"
                    label="Difícil"
                    note="flujo completo · errores entrelazados"
                    tone="danger"
                  />
                </div>
                <p className="mt-3 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>5 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={4}
            icon="🎯"
            title="El dealer elige el tipo de reto"
            body={
              <>
                <p>
                  Después de ver el dado, el dealer decide entre{" "}
                  <strong>Participantes</strong> o{" "}
                  <strong>Detecta el Error</strong> según la dificultad.
                  Quienes apostaron al tipo correcto en{" "}
                  <Badge tone="gold">Zona 2</Badge> cobran inmediatamente.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>10 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={5}
            icon="✍️"
            title="Todos resuelven en papel simultáneamente"
            body={
              <>
                <p>
                  Incluyendo el lanzador. El dealer{" "}
                  <strong>lee el código en voz alta una sola vez</strong>{" "}
                  si es Detecta el Error, o simplemente anuncia el patrón
                  si es Participantes. Todos escriben en papel.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>60–90 segundos</strong> según
                  dificultad.
                </p>
              </>
            }
          />

          <StepCard
            n={6}
            icon="📄"
            title="Todos entregan al mismo tiempo"
            body={
              <p>
                Cuando termina el tiempo, todos entregan su papel a la
                vez. No hay ventaja por terminar antes —{" "}
                <strong>sólo por tener la respuesta correcta y completa</strong>.
              </p>
            }
          />

          <StepCard
            n={7}
            icon="🔎"
            title="El dealer evalúa con su acordeón"
            body={
              <>
                <p>
                  Usando la plantilla del patrón, el dealer valida cada
                  respuesta. Marca correctas, parciales e incorrectas.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>15–20 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={8}
            icon="💰"
            title="Pagos"
            body={
              <>
                <ul className="flex flex-col gap-1.5 text-sm text-[--color-cream]/85">
                  <BulletLine marker="★" markerColor="text-[--color-gold-300]">
                    <strong>Un ganador:</strong> se lleva el pozo ×
                    multiplicador de dificultad (×2 / ×3 / ×5).
                  </BulletLine>
                  <BulletLine marker="⋯" markerColor="text-[--color-gold-300]">
                    <strong>Empate:</strong> el pozo se divide entre
                    quienes acertaron.
                  </BulletLine>
                  <BulletLine marker="✕" markerColor="text-[--color-chip-red-300]">
                    <strong>Nadie acierta:</strong> la casa se lleva el
                    pozo y el dealer revela la respuesta correcta.
                  </BulletLine>
                </ul>
                <div className="mt-3 rounded-lg bg-[--color-chip-red-500]/10 p-3 ring-1 ring-inset ring-[--color-chip-red-400]/40">
                  <p className="text-[12px] leading-relaxed text-[--color-cream]/80">
                    Si el <strong>lanzador pierde</strong>, paga según la
                    dificultad que cayó: 1:1 en fácil, 2:1 en medio, 3:1
                    en difícil. Si gana, recupera su apuesta y cobra como
                    cualquier otro jugador.
                  </p>
                </div>
              </>
            }
          />

          <StepCard
            n={9}
            icon="🔁"
            title="Rota el turno"
            body={
              <p>
                El siguiente jugador pasa a ser el lanzador — elige nuevo
                patrón, apuesta, tira. La rotación asegura que todos
                carguen con la ventaja (elegir) y la desventaja (pagar
                aunque no ganen) del rol.
              </p>
            }
          />
        </ol>
      </Section>

      <Section
        label="Referencia"
        title="Tabla de multiplicadores"
        description="Cuánto paga cada dificultad — y qué exige por tipo de reto."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PayoutChip
            label="×2 Fácil · 1–2"
            sub="lanzador paga 1:1 · demás ×2"
            pays="× 2"
            tone="felt"
          />
          <PayoutChip
            label="×3 Medio · 3–4"
            sub="lanzador paga 2:1 · demás ×3"
            pays="× 3"
            tone="gold"
          />
          <PayoutChip
            label="×5 Difícil · 5–6"
            sub="lanzador paga 3:1 · demás ×5"
            pays="× 5"
            tone="danger"
          />
          <PayoutChip
            label="Zona 1 · Dificultad"
            sub="paga al instante si aciertas el dado"
            pays="cobra inmediato"
            tone="info"
          />
          <PayoutChip
            label="Zona 2 · Tipo de reto"
            sub="paga al instante si aciertas la elección del dealer"
            pays="cobra inmediato"
            tone="gold"
          />
          <PayoutChip
            label="Casa gana"
            sub="nadie entrega respuesta correcta"
            pays="pozo completo"
            tone="neutral"
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
            <NoteItem icon="📣">
              <strong>Anuncio fijo:</strong> una vez que el lanzador dijo
              el patrón en voz alta, ya no se puede cambiar — ni siquiera
              si le cae una dificultad que no esperaba.
            </NoteItem>
            <NoteItem icon="🗣️">
              <strong>Lectura del código:</strong> en Detecta el Error el
              dealer lo lee <em>una sola vez</em>. Si alguien se perdió,
              se lo pierde — es parte de la presión.
            </NoteItem>
            <NoteItem icon="🎭">
              <strong>Ventaja del lanzador:</strong> es elegir el patrón
              que mejor domina. Su desventaja es la apuesta obligatoria
              que paga aunque no gane.
            </NoteItem>
            <NoteItem icon="⏱️">
              <strong>Tiempo según dificultad:</strong> 60 seg para fácil
              y medio; el dealer puede extender a 90 seg para difícil.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> la apuesta obligatoria y
              las apuestas de zonas quedan a discreción del dealer según
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
        El lanzador anuncia un patrón y tira el dado. Todos compiten en
        paralelo para resolver — <span className="text-[--color-gold-300]">Participantes</span>{" "}
        o <span className="text-[--color-gold-300]">Detecta el Error</span> —
        y el primero en entregar correctamente se lleva el pozo con
        multiplicador.
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

function MultiplierTile({
  mult,
  label,
  note,
  tone,
}: {
  mult: string;
  label: string;
  note: string;
  tone: "success" | "warning" | "danger";
}) {
  const TONE_BG: Record<typeof tone, string> = {
    success: "bg-[#1f4a2a]",
    warning: "bg-[#5e5420]",
    danger: "bg-[#6f1d1b]",
  };
  return (
    <div
      className={[
        "rounded-lg px-3 py-3 text-center ring-1 ring-inset ring-[--color-gold-500]/40",
        TONE_BG[tone],
      ].join(" ")}
    >
      <p className="font-display text-xl font-black text-[--color-ivory] sm:text-2xl">
        {mult}
      </p>
      <p className="mt-0.5 font-label text-[10px] uppercase tracking-[0.2em] text-[--color-gold-300]/85">
        {label}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-[--color-cream]/80">
        {note}
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
  tone: "gold" | "info" | "danger" | "felt" | "neutral";
}) {
  const TONE_BORDER: Record<typeof tone, string> = {
    gold: "border-[--color-gold-500]/60",
    info: "border-[--color-chip-blue-400]/60",
    danger: "border-[--color-chip-red-400]/60",
    felt: "border-[--color-felt-500]/60",
    neutral: "border-[--color-cream]/25",
  };
  const TONE_TEXT: Record<typeof tone, string> = {
    gold: "text-[--color-gold-300]",
    info: "text-[--color-chip-blue-300]",
    danger: "text-[--color-chip-red-300]",
    felt: "text-[--color-cream]",
    neutral: "text-[--color-cream]/80",
  };
  return (
    <div
      style={{
        paddingLeft: "2rem",
        paddingRight: "1.25rem",
        paddingTop: "1rem",
        paddingBottom: "1rem",
      }}
      className={[
        "flex items-center justify-between gap-3 rounded-xl border-l-4 bg-[--color-smoke-800]/70 shadow-[0_3px_10px_rgba(0,0,0,0.3)]",
        TONE_BORDER[tone],
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="truncate font-display text-sm text-[--color-ivory] sm:text-base">
          {label}
        </p>
        <p className="truncate font-label text-[10px] tracking-widest text-[--color-cream]/55">
          {sub}
        </p>
      </div>
      <p
        className={[
          "shrink-0 font-label text-[10px] tracking-widest sm:text-xs",
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
