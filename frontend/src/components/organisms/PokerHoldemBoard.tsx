import type { ReactNode } from "react";

/**
 * Replica de la mesa "El River" de Poker Hold'em de Patrones. Es un
 * tablero de referencia — no driver de juego — dividido en tres zonas:
 *
 *   1. Escenario — 5 cartas comunitarias (flop F1/F2/F3, turn T, river R)
 *      + el pozo en el centro abajo.
 *   2. Posiciones — J1..J4, con J1 como small blind y J2 como big blind.
 *   3. Rondas de apuesta — 4 momentos: pre-flop, post-flop, post-turn,
 *      post-river.
 *
 * Los colores siguen la convención de la mesa: el flop (F1/F2/F3) usa el
 * azul oscuro de "comportamiento" en el tablero de ruleta, el turn usa
 * café/estructural, el river usa el rojo/maroon más intenso — así se lee
 * visualmente que la tensión sube conforme se revelan más cartas.
 */
export function PokerHoldemBoard() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-[--color-felt-900] shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-2 ring-[--color-gold-500]/40">
      <div className="min-w-[820px] p-3 sm:p-5">
        <Header />

        <Zone label="Zona de escenario — cartas comunitarias">
          <CommunityRow />
          <Pozo />
        </Zone>

        <Zone label="Posiciones de jugadores">
          <div className="grid gap-2 sm:grid-cols-4">
            <PlayerSlot
              name="J1"
              role="small blind"
              detail="2 cartas · zona apuesta"
            />
            <PlayerSlot
              name="J2"
              role="big blind"
              detail="2 cartas · zona apuesta"
            />
            <PlayerSlot name="J3" detail="2 cartas · zona apuesta" />
            <PlayerSlot name="J4" detail="2 cartas · zona apuesta" />
          </div>
        </Zone>

        <Zone label="Rondas de apuesta">
          <div className="grid gap-2 sm:grid-cols-4">
            <RoundSlot
              title="PRE-FLOP"
              detail="antes de ver escenario · apuesta ciega"
              bg="bg-[#2f3b1a]"
            />
            <RoundSlot
              title="POST-FLOP"
              detail="después de F1+F2+F3 · primera lectura"
              bg="bg-[#1f2b2f]"
            />
            <RoundSlot
              title="POST-TURN"
              detail="después de T · la restricción cambia todo"
              bg="bg-[#1e3e2a]"
            />
            <RoundSlot
              title="POST-RIVER"
              detail="apuesta final antes del showdown"
              bg="bg-[#134832]"
            />
          </div>
        </Zone>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-4 flex flex-col items-center gap-2">
      <div className="w-full rounded-lg bg-black/30 px-4 py-2 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
        <p className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
          Mesa — El River
        </p>
      </div>
      <div className="rounded-full bg-[--color-felt-800]/80 px-4 py-1 ring-1 ring-inset ring-[--color-gold-500]/50">
        <p className="font-label text-[11px] tracking-[0.2em] text-[--color-gold-300]">
          Dealer — reparte y revela
        </p>
      </div>
    </div>
  );
}

function CommunityRow() {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-2 sm:flex-nowrap">
      <CommunityCard label="F1" role="flop" tone="flop" />
      <CommunityCard label="F2" role="flop" tone="flop" />
      <CommunityCard label="F3" role="flop" tone="flop" />
      <Dot />
      <CommunityCard label="T" role="turn" tone="turn" />
      <Dot />
      <CommunityCard label="R" role="river" tone="river" />
    </div>
  );
}

type CommunityTone = "flop" | "turn" | "river";

const COMMUNITY_BG: Record<CommunityTone, string> = {
  flop: "bg-[#1e1b4b]",
  turn: "bg-[#5a3316]",
  river: "bg-[#5a1a1a]",
};

function CommunityCard({
  label,
  role,
  tone,
}: {
  label: string;
  role: string;
  tone: CommunityTone;
}) {
  return (
    <div
      className={[
        "flex min-w-[96px] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-3 py-5 text-center ring-1 ring-inset ring-[--color-gold-500]/50",
        COMMUNITY_BG[tone],
      ].join(" ")}
    >
      <p className="font-display text-2xl font-black leading-none text-[--color-ivory] sm:text-3xl">
        {label}
      </p>
      <p className="font-label text-[10px] tracking-[0.2em] text-[--color-cream]/70 sm:text-xs">
        {role}
      </p>
    </div>
  );
}

function Dot() {
  return (
    <div
      aria-hidden
      className="flex min-w-[18px] items-center justify-center self-center text-lg text-[--color-gold-300]/70"
    >
      ·
    </div>
  );
}

function Pozo() {
  return (
    <div className="mt-4 flex justify-center">
      <div className="flex min-h-[72px] min-w-[220px] items-center justify-center rounded-xl bg-[#4a2a15] px-16 py-5 text-center shadow-[0_6px_18px_rgba(0,0,0,0.4)] ring-2 ring-inset ring-[--color-gold-500]/60 sm:min-h-[84px] sm:min-w-[280px] sm:px-20 sm:py-6">
        <p className="font-display text-base font-black tracking-[0.25em] text-[--color-ivory] sm:text-lg">
          POZO
        </p>
      </div>
    </div>
  );
}

function PlayerSlot({
  name,
  role,
  detail,
}: {
  name: string;
  role?: string;
  detail: string;
}) {
  return (
    <div className="flex min-h-[86px] flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-[--color-gold-500]/40 bg-black/20 px-3 py-3 text-center">
      <p className="font-display text-lg font-black text-[--color-ivory]">
        {name}
      </p>
      {role && (
        <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[--color-gold-300]/85 sm:text-[11px]">
          {role}
        </p>
      )}
      <p className="text-[11px] leading-snug text-[--color-cream]/70 sm:text-xs">
        {detail}
      </p>
    </div>
  );
}

function RoundSlot({
  title,
  detail,
  bg,
}: {
  title: string;
  detail: string;
  bg: string;
}) {
  return (
    <div
      className={[
        "flex min-h-[88px] flex-col items-center justify-center gap-1 rounded-md px-3 py-4 text-center ring-1 ring-inset ring-[--color-gold-500]/45",
        bg,
      ].join(" ")}
    >
      <p className="font-display text-sm font-black leading-tight tracking-wide text-[--color-ivory] sm:text-base">
        {title}
      </p>
      <p className="text-[11px] leading-snug text-[--color-cream]/80 sm:text-xs">
        {detail}
      </p>
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
