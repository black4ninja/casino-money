import type { ReactNode } from "react";

/**
 * Replica de la "Mesa — El Cubilete". Cada jugador arranca con 5 dados
 * bajo su cubillete; la mesa hace apuestas sobre el total de dados por
 * categoría. Los colores del mapa siguen la convención GoF del proyecto:
 *
 *   1-2 Creacional     — verde
 *   3-4 Estructural    — marrón / rojo
 *   5-6 Comportamiento — azul oscuro
 *
 * El tablero se lee en 4 bandas:
 *   1. Mapa de dados (qué categoría representa cada cara).
 *   2. Apuesta activa + pozo.
 *   3. Zona de decisión — las 3 acciones del turno.
 *   4. Zona de recuperación — pregunta de rescate + eliminación.
 */
export function CubileteBoard() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-[--color-felt-900] shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-2 ring-[--color-gold-500]/40">
      <div className="min-w-[880px] p-3 sm:p-5">
        <Header />

        <Zone label="Mapa de dados — visible para todos en todo momento">
          <div className="grid gap-2 sm:grid-cols-3">
            <DiceMap
              face="1 — 2"
              category="Creacional"
              patterns="Abstract Factory · Builder · Factory Method · Prototype · Singleton"
              bg="bg-[#0e5e3e]"
            />
            <DiceMap
              face="3 — 4"
              category="Estructural"
              patterns="Adapter · Bridge · Composite · Decorator · Facade · Flyweight · Proxy"
              bg="bg-[#6f3a1d]"
            />
            <DiceMap
              face="5 — 6"
              category="Comportamiento"
              patterns="Chain of Resp. · Command · Iterator · Mediator · Memento · Observer · State · Strategy · Template · Visitor · Interpreter"
              bg="bg-[#1e1b4b]"
            />
          </div>
        </Zone>

        <Zone label="Zona de apuesta activa">
          <div className="grid gap-2 sm:grid-cols-[1.6fr_1fr]">
            <ApuestaActiva />
            <Pozo />
          </div>
        </Zone>

        <Zone label="Zona de decisión">
          <div className="grid gap-2 sm:grid-cols-3">
            <DecisionCard
              title="¡DUDO!"
              lines={[
                "crees que la apuesta es falsa",
                "se revelan todos los dados",
                "el perdedor pierde un dado",
              ]}
              bg="bg-[#6f1d1b]"
            />
            <DecisionCard
              title="SUBIR"
              lines={[
                "subir cantidad o cambiar categoría",
                "siempre debe ser apuesta más alta",
                "el juego continúa",
              ]}
              bg="bg-[#1f4a2a]"
            />
            <DecisionCard
              title="¡EXACTO!"
              lines={[
                "crees que hay exactamente esa cantidad",
                "si aciertas: todos pierden un dado",
                "si fallas: tú pierdes dos dados",
              ]}
              bg="bg-[#6b5b18]"
            />
          </div>
        </Zone>

        <Zone label="Zona de recuperación — cuando un jugador pierde un dado">
          <div className="grid gap-2 sm:grid-cols-2">
            <RecoveryCard
              title="PREGUNTA DE RESCATE"
              lines={[
                "el dealer pregunta sobre un patrón de la categoría del dado perdido",
                "30 segundos para responder",
                "acierta → recupera el dado · falla → lo pierde definitivamente",
              ]}
              bg="bg-[#3a4a1a]"
            />
            <RecoveryCard
              title="ELIMINACIÓN"
              lines={[
                "jugador sin dados queda fuera de la ronda",
                "puede seguir apostando fichas como espectador en la Zona de Decisión",
              ]}
              bg="bg-[#3a1414]"
            />
          </div>
        </Zone>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-4 rounded-lg bg-black/30 px-4 py-2 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
      <p className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
        Mesa — El Cubilete
      </p>
    </div>
  );
}

function DiceMap({
  face,
  category,
  patterns,
  bg,
}: {
  face: string;
  category: string;
  patterns: string;
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[124px] flex-col items-center justify-start gap-2 rounded-md px-3 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        bg,
      ].join(" ")}
    >
      <p className="flex items-center gap-2 font-display text-lg font-black text-[--color-ivory] sm:text-xl">
        <span aria-hidden>🎲</span>
        {face}
      </p>
      <p className="font-label text-[11px] tracking-[0.2em] text-[--color-gold-300]/85 sm:text-xs">
        {category.toUpperCase()}
      </p>
      <p className="text-[11px] leading-relaxed text-[--color-cream]/80 sm:text-xs">
        {patterns}
      </p>
    </div>
  );
}

function ApuestaActiva() {
  return (
    <div className="flex min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-md bg-[#1e1b4b] px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50">
      <p className="font-display text-base font-black tracking-[0.18em] text-[--color-ivory] sm:text-lg">
        APUESTA ACTUAL EN MESA
      </p>
      <p className="text-[12px] leading-snug text-[--color-cream]/80 sm:text-sm">
        ej: "hay al menos 6 dados de Estructural"
      </p>
      <p className="font-label text-[11px] tracking-[0.18em] text-[--color-cream]/65">
        cantidad · categoría · mínimo o exacto
      </p>
    </div>
  );
}

function Pozo() {
  return (
    <div className="flex min-h-[110px] flex-col items-center justify-center gap-1 rounded-md bg-[#4a2a15] px-4 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/55">
      <p className="font-display text-base font-black tracking-[0.25em] text-[--color-ivory] sm:text-lg">
        POZO
      </p>
      <p className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        fichas acumuladas de apuestas de entrada
      </p>
    </div>
  );
}

function DecisionCard({
  title,
  lines,
  bg,
}: {
  title: string;
  lines: string[];
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[120px] flex-col items-center justify-center gap-1.5 rounded-md px-3 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        bg,
      ].join(" ")}
    >
      <p className="font-display text-sm font-black tracking-[0.2em] text-[--color-ivory] sm:text-base">
        {title}
      </p>
      {lines.map((l, i) => (
        <p
          key={i}
          className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs"
        >
          {l}
        </p>
      ))}
    </div>
  );
}

function RecoveryCard({
  title,
  lines,
  bg,
}: {
  title: string;
  lines: string[];
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[108px] flex-col items-center justify-center gap-1 rounded-md px-3 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        bg,
      ].join(" ")}
    >
      <p className="font-display text-sm font-black tracking-[0.2em] text-[--color-ivory] sm:text-base">
        {title}
      </p>
      {lines.map((l, i) => (
        <p
          key={i}
          className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs"
        >
          {l}
        </p>
      ))}
    </div>
  );
}

function Zone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-2 font-label text-[10px] uppercase tracking-[0.22em] text-[--color-gold-300]/85 sm:text-[11px]">
        {label}
      </p>
      {children}
    </div>
  );
}
