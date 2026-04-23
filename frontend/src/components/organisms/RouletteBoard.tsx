import type { ReactNode } from "react";
import {
  patternsByCategoryForBoard,
  type DesignPattern,
} from "@/domain/designPatterns";

/**
 * Replica of the physical betting board the roulette is played against.
 * The numbers printed on each cell are the stable `boardNumber` — NOT the
 * digital wheel's slot position — so a given pattern always lives on the
 * same cell even as the wheel visually reshuffles.
 *
 * Layout (matches the paper-board image):
 *   ┌ header
 *   ├ "0 — Comodín" strip
 *   ├ CREACIONAL   — 5 cells
 *   ├ ESTRUCTURAL  — 7 cells
 *   ├ COMPORTAMIENTO — 11 cells, split 6 + 5 across two rows
 *   ├ outside-bets grid (category bets + combined bets + TOP 5 GoF)
 *   └ footer reminder about PLENO
 */
export function RouletteBoard() {
  const groups = patternsByCategoryForBoard();
  const behavioralRow1 = groups.behavioral.filter((p) => p.boardNumber <= 18);
  const behavioralRow2 = groups.behavioral.filter((p) => p.boardNumber > 18);

  return (
    <div className="overflow-x-auto rounded-2xl bg-[--color-felt-900] shadow-[0_12px_40px_rgba(0,0,0,0.5)] ring-2 ring-[--color-gold-500]/40">
      <div className="min-w-[780px] p-3 sm:p-5">
      {/* Header */}
      <div className="mb-3 rounded-lg bg-black/30 px-4 py-2 text-center ring-1 ring-inset ring-[--color-gold-500]/30">
        <p className="font-label text-sm tracking-[0.3em] text-[--color-gold-300]">
          Tablero de Patrones GoF
        </p>
      </div>

      {/* Zero strip */}
      <div className="mb-3 rounded-lg bg-[--color-chip-green-500]/15 px-4 py-3 text-center ring-2 ring-inset ring-[--color-chip-green-400]/70">
        <p className="font-label text-sm tracking-[0.18em] text-[--color-chip-green-300]">
          <span className="text-xl font-black text-[--color-ivory]">0</span>
          <span className="mx-3 text-[--color-cream]/50">—</span>
          Comodín
          <span className="mx-3 text-[--color-cream]/50">·</span>
          <span className="text-xs font-normal normal-case tracking-wider text-[--color-cream]/70">
            la casa gana todas las apuestas activas
          </span>
        </p>
      </div>

      {/* Numbered grid */}
      <div className="mb-3 flex flex-col gap-2">
        <BoardRow label="Creacional" tone="creational" cols={5}>
          {groups.creational.map((p) => (
            <BoardCell key={p.id} pattern={p} tone="creational" />
          ))}
        </BoardRow>

        <BoardRow label="Estructural" tone="structural" cols={7}>
          {groups.structural.map((p) => (
            <BoardCell key={p.id} pattern={p} tone="structural" />
          ))}
        </BoardRow>

        <BoardRowBehavioral
          row1={behavioralRow1}
          row2={behavioralRow2}
        />
      </div>

      {/* Outside bets */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <BetBox
          label="Creacional"
          sub="5 patrones · paga 4:1"
          bg="bg-[#0e5e3e]"
        />
        <BetBox
          label="Estructural"
          sub="7 patrones · paga 3:1"
          bg="bg-[#6f1d1b]"
        />
        <BetBox
          label="Comportamiento"
          sub="11 patrones · paga 2:1"
          bg="bg-[#1e1b4b]"
        />
        <BetBox
          label="Crea + Est"
          sub="12 patrones · paga 1:1"
          bg="bg-[#3e3e1a]"
        />
        <BetBox
          label="Top 5 GoF"
          sub="los más usados · paga 4:1"
          bg="bg-[#6b5b18]"
        />
        <BetBox
          label="Est + Comp"
          sub="18 patrones · paga 1:1"
          bg="bg-[#2a1e3e]"
        />
      </div>

      {/* Footer */}
      <p className="px-2 text-center font-label text-[10px] tracking-widest text-[--color-cream]/50 sm:text-xs">
        Pleno (número exacto) · paga 22:1
        <span className="mx-2 text-[--color-cream]/30">|</span>
        las fichas se colocan sobre el patrón antes de girar la rueda digital
      </p>
      </div>
    </div>
  );
}

type CellTone = "creational" | "structural" | "behavioral";

const CELL_BG: Record<CellTone, string> = {
  // felt-700 was too close to the page's felt-900 background — bumped to a
  // brighter green so cells read clearly at a glance.
  creational: "bg-[#0e5e3e]",
  structural: "bg-[#6f1d1b]",
  behavioral: "bg-[#1e1b4b]",
};

const SIDE_LABEL_TEXT: Record<CellTone, string> = {
  creational: "text-[--color-chip-green-300]",
  structural: "text-[#ff8585]",
  behavioral: "text-[--color-chip-blue-300]",
};

function BoardCell({
  pattern,
  tone,
}: {
  pattern: DesignPattern;
  tone: CellTone;
}) {
  return (
    <div
      className={[
        "relative flex min-h-[68px] items-center justify-center rounded-md px-2 py-3 text-center ring-1 ring-inset ring-[--color-gold-500]/40",
        CELL_BG[tone],
      ].join(" ")}
    >
      <span className="absolute left-1.5 top-1 font-label text-[10px] text-[--color-gold-300]/90">
        {pattern.boardNumber}
      </span>
      <span className="font-label text-[11px] leading-tight tracking-wide text-[--color-ivory] sm:text-xs">
        {pattern.shortName}
      </span>
    </div>
  );
}

function BoardRow({
  label,
  tone,
  cols,
  children,
}: {
  label: string;
  tone: CellTone;
  cols: number;
  children: ReactNode;
}) {
  return (
    <div className="flex items-stretch gap-2">
      <SideLabel text={label} tone={tone} />
      <div
        className="grid flex-1 gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {children}
      </div>
    </div>
  );
}

function BoardRowBehavioral({
  row1,
  row2,
}: {
  row1: DesignPattern[];
  row2: DesignPattern[];
}) {
  return (
    <div className="flex items-stretch gap-2">
      <SideLabel text="Comportamiento" tone="behavioral" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="grid grid-cols-6 gap-2">
          {row1.map((p) => (
            <BoardCell key={p.id} pattern={p} tone="behavioral" />
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {row2.map((p) => (
            <BoardCell key={p.id} pattern={p} tone="behavioral" />
          ))}
        </div>
      </div>
    </div>
  );
}

function SideLabel({ text, tone }: { text: string; tone: CellTone }) {
  return (
    <div className="flex w-6 shrink-0 items-center justify-center rounded-md bg-black/25 ring-1 ring-inset ring-[--color-gold-500]/30 sm:w-8">
      <p
        className={[
          "font-label text-[9px] tracking-[0.25em] [writing-mode:vertical-rl] rotate-180 whitespace-nowrap sm:text-[10px]",
          SIDE_LABEL_TEXT[tone],
        ].join(" ")}
      >
        {text.toUpperCase()}
      </p>
    </div>
  );
}

function BetBox({
  label,
  sub,
  bg,
}: {
  label: string;
  sub: string;
  bg: string;
}) {
  return (
    <div
      className={[
        "rounded-md px-3 py-3 text-center ring-1 ring-inset ring-[--color-gold-500]/40",
        bg,
      ].join(" ")}
    >
      <p className="font-label text-xs tracking-[0.18em] text-[--color-gold-300]">
        {label.toUpperCase()}
      </p>
      <p className="mt-1 text-[11px] text-[--color-cream]/80 sm:text-xs">
        {sub}
      </p>
    </div>
  );
}
