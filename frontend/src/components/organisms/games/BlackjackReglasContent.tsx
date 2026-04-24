import type { ReactNode } from "react";
import { BlackjackBoard } from "../BlackjackBoard";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";

/**
 * Narrative rules content for Blackjack de Patrones — "Plántate".
 * Reutilizable entre la página /juegos/blackjack/reglas y los tabs
 * "Reglas" del dealer y del jugador.
 *
 * El juego no tiene jugabilidad digital: el dealer lee las pistas en
 * voz alta y los jugadores gritan cuando se plantan. El dealer paga
 * desde el tab "Pagar" con la mecánica existente.
 */
export function BlackjackReglasContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="El tablero"
        title="Así se ve la mesa"
        description="Seis pistas con multiplicadores descendentes, una zona para dibujar el UML, la tabla de cobro y cuatro posiciones."
      >
        <p className="mb-2 text-xs text-[--color-cream]/50 sm:hidden">
          ← desliza para ver la mesa completa →
        </p>
        <BlackjackBoard />
      </Section>

      <Section
        label="Reglas clave"
        title="Cómo funciona plantarse"
        description="Apuesta ciega, gritos en voz alta, diagrama de memoria. El que duda, pierde el multiplicador alto."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🪙">
              <strong>Apuesta obligatoria</strong> antes de ver cualquier
              pista: todos ponen fichas simultáneamente antes de que el
              dealer abra la primera pista. No puedes esperar a ver qué
              tan difícil es.
            </NoteItem>
            <NoteItem icon="🗣️">
              <strong>Plantarse:</strong> gritas{" "}
              <em>"¡Me planto!"</em> y das el nombre del patrón en voz
              alta inmediatamente. El dealer confirma o niega. No hay
              tiempo para pensar después de gritar — si dudas, no te
              plantes todavía.
            </NoteItem>
            <NoteItem icon="✕">
              <strong>Error:</strong> pierdes tu apuesta y sales de esa
              ronda. El dealer continúa revelando pistas para los demás
              jugadores activos.
            </NoteItem>
            <NoteItem icon="🤝">
              <strong>Dos jugadores al mismo tiempo:</strong> el dealer
              los escucha a los dos. Si ambos aciertan, ambos cobran su
              multiplicador. Si ambos fallan, ambos pierden.
            </NoteItem>
            <NoteItem icon="🏦">
              <strong>La casa gana</strong> si nadie se planta en las 6
              pistas, o si todos los que se plantaron fallaron.
            </NoteItem>
          </ul>

          <div className="mt-5 rounded-lg bg-[--color-gold-500]/10 p-4 ring-1 ring-inset ring-[--color-gold-500]/30">
            <p className="font-label text-[10px] tracking-widest text-[--color-gold-300] sm:text-xs">
              Ritmo de mesa
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/85">
              Una ronda toma <strong>2–3 minutos</strong>. Caben{" "}
              <strong>15–20 rondas</strong> en una sesión de 40 minutos.
            </p>
          </div>
        </Card>
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso de la ronda"
        description="Desde el secreto del dealer hasta el pago inmediato."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🗂️"
            title="El dealer toma un set de pistas en secreto"
            body={
              <p>
                El dealer elige un patrón objetivo y separa su set de{" "}
                <strong>6 pistas</strong> ordenadas de más difícil a más
                directa. Sólo él las ve hasta que las va leyendo.
              </p>
            }
          />

          <StepCard
            n={2}
            icon="🪙"
            title="Todos apuestan simultáneamente"
            body={
              <>
                <p>
                  Cada jugador coloca su ficha en su posición{" "}
                  <strong>antes de escuchar la primera pista</strong>. No
                  puedes ver nada para decidir cuánto arriesgar.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>20 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={3}
            icon="🗣️"
            title="Dealer lee Pista 1 — pausa de 10 segundos"
            body={
              <>
                <p>
                  Es la pista <strong>más difícil</strong> — el problema.
                  Pero si la cachas aquí pagas <Badge tone="gold">×6</Badge>.
                  Tras leerla hay 10 segundos de pausa para que alguien
                  grite.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Quien quiera plantarse <strong>grita ahora</strong> o
                  espera la siguiente.
                </p>
              </>
            }
          />

          <StepCard
            n={4}
            icon="🔁"
            title="El dealer continúa pista por pista"
            body={
              <>
                <p className="mb-3">
                  Cada pista revela más — y el multiplicador cae. Las pistas
                  3, 4 y 5 van destapando el <strong>UML</strong> del patrón:
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <UmlTile
                    title="Pista 3"
                    subtitle="UML parcial"
                    detail="aparece la 1ª clase sola · ×4"
                  />
                  <UmlTile
                    title="Pista 4"
                    subtitle="UML creciendo"
                    detail="aparece la 2ª clase · ×3"
                  />
                  <UmlTile
                    title="Pista 5"
                    subtitle="UML completo"
                    detail="relaciones completas · ×2"
                  />
                </div>
                <p className="mt-3 text-xs text-[--color-cream]/65">
                  La Pista 6 es prácticamente un hint directo — paga{" "}
                  <Badge tone="danger">×1</Badge> y ya casi no hay riesgo.
                </p>
              </>
            }
          />

          <StepCard
            n={5}
            icon="✋"
            title="Alguien grita ¡Me planto!"
            body={
              <>
                <p className="mb-3">
                  El jugador dice el <strong>nombre del patrón</strong>{" "}
                  inmediatamente. El dealer confirma o niega:
                </p>
                <ul className="flex flex-col gap-1.5 text-sm text-[--color-cream]/85">
                  <BulletLine marker="✓" markerColor="text-[--color-chip-green-300]">
                    <strong>Nombre correcto:</strong> pasa al paso 6 para
                    dibujar el UML.
                  </BulletLine>
                  <BulletLine marker="✕" markerColor="text-[--color-chip-red-300]">
                    <strong>Nombre incorrecto:</strong> pierde la apuesta
                    y sale de la ronda. El dealer sigue leyendo pistas
                    para los demás.
                  </BulletLine>
                </ul>
              </>
            }
          />

          <StepCard
            n={6}
            icon="📐"
            title={'Dibuja el UML completo (60")'}
            body={
              <>
                <p className="mb-3">
                  El jugador que acertó recibe una <strong>hoja en blanco</strong>{" "}
                  y dibuja el UML <em>de memoria</em>: clases, relaciones
                  y nombres de métodos clave. Tiene{" "}
                  <strong>60 segundos</strong>.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <PayoutTile
                    title="Nombre ✓ · Diagrama ✓"
                    detail="Cobra el multiplicador completo."
                    tone="success"
                  />
                  <PayoutTile
                    title="Nombre ✓ · Diagrama parcial"
                    detail="Cobra la mitad del multiplicador."
                    tone="warning"
                  />
                  <PayoutTile
                    title="Nombre ✕"
                    detail="El diagrama no importa. Pierde la apuesta y sale."
                    tone="danger"
                  />
                </div>
              </>
            }
          />

          <StepCard
            n={7}
            icon="💰"
            title="Pagos inmediatos"
            body={
              <>
                <p>
                  El dealer paga a quien acertó usando el{" "}
                  <strong>tab Pagar</strong>: multiplicador completo si el
                  diagrama quedó bien, o mitad si quedó parcial. Los que
                  fallaron ya salieron de la ronda.
                </p>
                <div className="mt-3 rounded-lg bg-[--color-chip-red-500]/10 p-3 ring-1 ring-inset ring-[--color-chip-red-400]/40">
                  <p className="text-[12px] leading-relaxed text-[--color-cream]/80">
                    <strong>Gana la casa:</strong> si nadie se plantó en
                    las 6 pistas, o si todos los que se plantaron
                    fallaron, el pozo se lo queda la casa.
                  </p>
                </div>
              </>
            }
          />
        </ol>
      </Section>

      <Section
        label="Referencia"
        title="Tabla de multiplicadores"
        description="Cuánto pagas por plantarte en cada pista — y qué pasa si dudas de más."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <PayoutChip
            label="Pista 1 · ×6"
            sub="el problema más difícil"
            pays="× 6"
            tone="gold"
          />
          <PayoutChip
            label="Pista 2 · ×5"
            sub="el dominio"
            pays="× 5"
            tone="gold"
          />
          <PayoutChip
            label="Pista 3 · ×4"
            sub="UML — 1ª clase sola"
            pays="× 4"
            tone="felt"
          />
          <PayoutChip
            label="Pista 4 · ×3"
            sub="UML — 2ª clase aparece"
            pays="× 3"
            tone="info"
          />
          <PayoutChip
            label="Pista 5 · ×2"
            sub="UML — relaciones completas"
            pays="× 2"
            tone="danger"
          />
          <PayoutChip
            label="Pista 6 · ×1"
            sub="hint casi directo"
            pays="× 1"
            tone="danger"
          />
          <PayoutChip
            label="Diagrama parcial"
            sub="nombre ok, UML incompleto"
            pays="mitad del multiplicador"
            tone="felt"
          />
          <PayoutChip
            label="Nombre incorrecto"
            sub="fallaste al plantarte"
            pays="pierdes apuesta"
            tone="danger"
          />
          <PayoutChip
            label="Casa gana"
            sub="nadie se planta o todos fallan"
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
            <NoteItem icon="⏱️">
              <strong>Pausas entre pistas:</strong> los 10 segundos son
              sugeridos. El dealer puede acortarlos si la mesa está
              activa o alargarlos si los jugadores están procesando.
            </NoteItem>
            <NoteItem icon="📝">
              <strong>Evaluación del diagrama:</strong> el dealer decide
              si el UML quedó completo, parcial o fallido. La rúbrica es
              la misma que usan en clase — clases, relaciones y nombres
              de métodos clave.
            </NoteItem>
            <NoteItem icon="🎭">
              <strong>Plantarse tarde:</strong> es una decisión de riesgo.
              En Pista 1 pagas ×6 pero casi nadie cacha; en Pista 6 pagas
              ×1 pero es casi un regalo. El juego recompensa la lectura
              temprana.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> la apuesta obligatoria
              queda a discreción del dealer según las fichas disponibles
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
        El dealer revela 6 pistas cada vez más fáciles. Quien grita{" "}
        <span className="text-[--color-gold-300]">"¡Me planto!"</span>{" "}
        primero y acierta el patrón (más el UML) cobra el multiplicador.
        Quien falla, pierde su apuesta.
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

function UmlTile({
  title,
  subtitle,
  detail,
}: {
  title: string;
  subtitle: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg bg-black/30 px-3 py-3 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
      <p className="font-display text-sm text-[--color-ivory]">{title}</p>
      <p className="mt-0.5 font-label text-[10px] uppercase tracking-[0.2em] text-[--color-gold-300]/85">
        {subtitle}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-[--color-cream]/70">
        {detail}
      </p>
    </div>
  );
}

function PayoutTile({
  title,
  detail,
  tone,
}: {
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger";
}) {
  const TONE_BG: Record<typeof tone, string> = {
    success: "bg-[#184a2a]",
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
      <p className="font-display text-sm font-black text-[--color-ivory]">
        {title}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-[--color-cream]/80">
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
