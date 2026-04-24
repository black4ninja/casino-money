import type { ReactNode } from "react";
import { CubileteBoard } from "../CubileteBoard";
import { Card } from "../../atoms/Card";
import { Badge } from "../../atoms/Badge";

/**
 * Narrative rules content para Cubilete de Patrones. Reutilizable entre
 * la página /juegos/cubilete/reglas y los tabs "Reglas" de dealer /
 * jugador. El juego no tiene jugabilidad digital — los dados son físicos
 * y el dealer opera la ronda; el pago se hace desde el tab "Pagar".
 */
export function CubileteReglasContent() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 sm:gap-10">
      <PullQuote />

      <Section
        label="El tablero"
        title="Así se ve la mesa"
        description="El mapa de dados a la vista, la apuesta activa en el centro, tres acciones posibles por turno y la zona de recuperación."
      >
        <p className="mb-2 text-xs text-[--color-cream]/50 sm:hidden">
          ← desliza para ver la mesa completa →
        </p>
        <CubileteBoard />
      </Section>

      <Section
        label="Reglas clave"
        title="Cantidad, categoría, mínimo o exacto"
        description="La apuesta siempre es sobre el total de dados de una categoría en toda la mesa — con 4 jugadores hay 20 dados en juego."
      >
        <Card tone="night" style={{ marginInline: 0 }}>
          <ul className="flex flex-col gap-4 text-sm text-[--color-cream]/85">
            <NoteItem icon="🪙">
              <strong>Inicio de ronda:</strong> cada jugador paga{" "}
              <strong>1 ficha obligatoria al pozo</strong>, sacude sus 5
              dados bajo el cubillete y los mira en secreto. Nadie más
              los ve.
            </NoteItem>
            <NoteItem icon="🗣️">
              <strong>Apuesta:</strong> el jugador activo dice en voz
              alta cuántos dados de una categoría hay en toda la mesa —
              formato fijo:{" "}
              <em>"hay al menos [cantidad] dados de [categoría]"</em>.
            </NoteItem>
            <NoteItem icon="⬆️">
              <strong>Subir:</strong> el siguiente jugador puede subir
              la cantidad o cambiar de categoría manteniendo/subiendo la
              cantidad. <strong>Nunca</strong> se baja.
            </NoteItem>
            <NoteItem icon="❓">
              <strong>¡Dudo!</strong> se revelan todos los cubiletes. Si
              la apuesta era válida, el que dudó pierde un dado. Si era
              mentira, el que apostó pierde un dado. Se activa la{" "}
              <strong>Pregunta de Rescate</strong>.
            </NoteItem>
            <NoteItem icon="🎯">
              <strong>¡Exacto!</strong> apuesta de alto riesgo. Si el
              conteo coincide exactamente con el número anunciado,{" "}
              <strong>todos los demás pierden un dado</strong>. Si
              fallas, pierdes <strong>dos de golpe</strong>.
            </NoteItem>
            <NoteItem icon="🧠">
              <strong>Pregunta de Rescate:</strong> el dealer pregunta
              sobre cualquier patrón de la categoría del dado perdido.
              Pregunta abierta corta — <em>"nombra dos participantes de
              Command"</em>. 30 segundos. El dealer evalúa.
            </NoteItem>
            <NoteItem icon="❌">
              <strong>Eliminación:</strong> sin dados = fuera de la ronda
              activa. Puedes seguir apostando fichas como espectador en la
              Zona de Decisión.
            </NoteItem>
          </ul>

          <div className="mt-5 rounded-lg bg-[--color-gold-500]/10 p-4 ring-1 ring-inset ring-[--color-gold-500]/30">
            <p className="font-label text-[10px] tracking-widest text-[--color-gold-300] sm:text-xs">
              Ritmo de mesa
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[--color-cream]/85">
              Una ronda toma <strong>5–7 minutos</strong> según cuántos
              jugadores queden activos. Caben <strong>5–6 rondas</strong>{" "}
              en 30–35 minutos.
            </p>
          </div>
        </Card>
      </Section>

      <Section
        label="Cómo se juega"
        title="Paso a paso de la ronda"
        description="Desde el pago de entrada hasta el último jugador en pie."
      >
        <ol className="flex flex-col gap-4">
          <StepCard
            n={1}
            icon="🪙"
            title="Todos pagan la apuesta de entrada"
            body={
              <>
                <p>
                  Cada jugador deja <strong>1 ficha</strong> en el pozo
                  antes de levantar cubilete. Es obligatorio para jugar
                  la ronda.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>20 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={2}
            icon="🎲"
            title="Sacude y mira tus dados en secreto"
            body={
              <>
                <p>
                  Bajo el cubillete, cada jugador revuelve sus{" "}
                  <strong>5 dados</strong> y los inspecciona sin enseñarlos.
                  Recuerda el mapa:
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <MapTile
                    face="1 — 2"
                    category="Creacional"
                    tone="creational"
                  />
                  <MapTile
                    face="3 — 4"
                    category="Estructural"
                    tone="structural"
                  />
                  <MapTile
                    face="5 — 6"
                    category="Comportamiento"
                    tone="behavioral"
                  />
                </div>
                <p className="mt-3 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>15 segundos</strong>.
                </p>
              </>
            }
          />

          <StepCard
            n={3}
            icon="🗣️"
            title="Jugador 1 hace la primera apuesta"
            body={
              <>
                <p>
                  En voz alta:{" "}
                  <em>"hay al menos 4 dados de Comportamiento"</em>. La
                  apuesta cubre <strong>todos los dados de la mesa</strong>,
                  no sólo los tuyos.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>10 segundos</strong>. Con 4
                  jugadores hay 20 dados en juego.
                </p>
              </>
            }
          />

          <StepCard
            n={4}
            icon="🔁"
            title="Turno de decisiones"
            body={
              <>
                <p className="mb-3">
                  El siguiente jugador elige una de tres acciones. El
                  turno se pasa hasta que alguien interrumpe con{" "}
                  <Badge tone="danger">¡Dudo!</Badge> o{" "}
                  <Badge tone="gold">¡Exacto!</Badge>.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ActionTile
                    name="Subir"
                    detail="Sube la cantidad o cambia de categoría manteniendo/subiendo la cantidad. Nunca se baja."
                    tone="success"
                  />
                  <ActionTile
                    name="¡Dudo!"
                    detail="Se revelan todos los cubiletes. Si la apuesta era válida, el que dudó pierde un dado; si era falsa, el que apostó pierde uno."
                    tone="danger"
                  />
                  <ActionTile
                    name="¡Exacto!"
                    detail="Alto riesgo. Si aciertas el número exacto, los demás pierden un dado cada uno. Si fallas, pierdes dos."
                    tone="warning"
                  />
                </div>
              </>
            }
          />

          <StepCard
            n={5}
            icon="🔍"
            title="Revelación y conteo"
            body={
              <>
                <p>
                  Cuando alguien dice <strong>¡Dudo!</strong> o{" "}
                  <strong>¡Exacto!</strong>, se levantan todos los
                  cubiletes y el dealer cuenta los dados de la categoría
                  en disputa. Todos ven el resultado al mismo tiempo.
                </p>
                <p className="mt-2 text-xs text-[--color-cream]/65">
                  Tiempo sugerido: <strong>15 segundos</strong> para el
                  conteo.
                </p>
              </>
            }
          />

          <StepCard
            n={6}
            icon="🧠"
            title="Pregunta de Rescate"
            body={
              <>
                <p className="mb-3">
                  Cuando un jugador pierde un dado, tiene una
                  oportunidad de recuperarlo. El dealer pregunta sobre
                  cualquier patrón de la <strong>categoría del dado
                  perdido</strong>:
                </p>
                <ul className="flex flex-col gap-1.5 text-sm text-[--color-cream]/85">
                  <BulletLine marker="•" markerColor="text-[--color-gold-300]">
                    <em>"¿cuándo usarías Facade sobre Adapter?"</em>
                  </BulletLine>
                  <BulletLine marker="•" markerColor="text-[--color-gold-300]">
                    <em>"nombra dos participantes del patrón Command"</em>
                  </BulletLine>
                </ul>
                <p className="mt-3 text-[13px] leading-relaxed text-[--color-cream]/80">
                  <strong>30 segundos</strong> para responder. El dealer
                  evalúa:
                </p>
                <ul className="mt-2 flex flex-col gap-1.5 text-sm text-[--color-cream]/85">
                  <BulletLine marker="✓" markerColor="text-[--color-chip-green-300]">
                    <strong>Acierta:</strong> recupera el dado.
                  </BulletLine>
                  <BulletLine marker="✕" markerColor="text-[--color-chip-red-300]">
                    <strong>Falla:</strong> lo pierde definitivamente.
                  </BulletLine>
                </ul>
              </>
            }
          />

          <StepCard
            n={7}
            icon="🔚"
            title="Se repite hasta que queda uno"
            body={
              <p>
                La ronda continúa — apuesta, turno, revelación,
                rescate — hasta que sólo queda <strong>1 jugador con
                dados</strong>. Quien se quedó sin dados queda eliminado
                de la ronda activa pero puede seguir apostando fichas
                como espectador en la Zona de Decisión.
              </p>
            }
          />

          <StepCard
            n={8}
            icon="💰"
            title="El último en pie se lleva el pozo"
            body={
              <p>
                El jugador que conserva dados gana la ronda y se lleva{" "}
                <strong>el pozo completo</strong>. El dealer le
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
            <NoteItem icon="🎲">
              <strong>Dados por jugador:</strong> cada uno arranca con{" "}
              <strong>5</strong>. La mesa total varía según cuántos
              jugadores entraron — con 4 jugadores, 20 dados.
            </NoteItem>
            <NoteItem icon="⬆️">
              <strong>Reglas de subir:</strong> la nueva apuesta siempre
              es <em>más alta</em> que la anterior — o más cantidad, o
              misma cantidad con categoría distinta pero con cantidad
              mayor si se mantiene la categoría.
            </NoteItem>
            <NoteItem icon="🎯">
              <strong>¡Exacto! es opcional:</strong> es el movimiento más
              arriesgado. En rondas tardías, cuando ya se sabe casi todo,
              puede ser un golpe que elimine a medio grupo a la vez.
            </NoteItem>
            <NoteItem icon="👀">
              <strong>Espectadores:</strong> si te eliminaron de la ronda
              activa puedes seguir apostando fichas desde afuera sobre
              quién crees que va a ganar.
            </NoteItem>
            <NoteItem icon="💎">
              <strong>Mínimo y máximo:</strong> la ficha de entrada queda
              a discreción del dealer según las fichas disponibles de la
              sesión.
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
        Cada jugador esconde 5 dados. Apuestas en voz alta cuántos dados
        hay <span className="text-[--color-gold-300]">de una categoría</span>{" "}
        en toda la mesa. Quien duda mal o falla el ¡Exacto! pierde dados
        y debe responder una <span className="text-[--color-gold-300]">pregunta de rescate</span>.
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

function MapTile({
  face,
  category,
  tone,
}: {
  face: string;
  category: string;
  tone: "creational" | "structural" | "behavioral";
}) {
  const TONE_BG: Record<typeof tone, string> = {
    creational: "bg-[#0e5e3e]",
    structural: "bg-[#6f3a1d]",
    behavioral: "bg-[#1e1b4b]",
  };
  return (
    <div
      className={[
        "rounded-lg px-3 py-3 text-center ring-1 ring-inset ring-[--color-gold-500]/40",
        TONE_BG[tone],
      ].join(" ")}
    >
      <p className="font-display text-sm font-black text-[--color-ivory]">
        🎲 {face}
      </p>
      <p className="mt-0.5 font-label text-[10px] uppercase tracking-[0.2em] text-[--color-gold-300]/85">
        {category}
      </p>
    </div>
  );
}

function ActionTile({
  name,
  detail,
  tone,
}: {
  name: string;
  detail: string;
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
      <p className="font-display text-sm font-black tracking-wide text-[--color-ivory]">
        {name}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-[--color-cream]/80">
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
