/**
 * The 24 slots of the pattern roulette — 23 numbered design patterns (1..23)
 * plus the "0 — Comodín" house-edge slot. The array order matches how they
 * appear around the digital wheel and is tuned so adjacent slots almost
 * always have different colors (European roulette style).
 *
 * `boardNumber` is the stable physical-board number each pattern keeps no
 * matter where it sits on the wheel: 0 for the comodín, 1..23 alphabetically
 * within each category (as shown on the physical betting board).
 *
 * `tone` matches the Badge / Chip color system used elsewhere:
 *   gold    → Creational
 *   info    → Structural   (blue)
 *   danger  → Behavioral   (red)
 *   success → Zero         (green, traditional)
 *
 * `displayNumber` is computed post-declaration: 0 for the zero slot, and
 * 1..23 for the remaining slots in the array order below. This is what the
 * digital wheel labels use — NOT the stable board number.
 */
export type PatternCategory =
  | "creational"
  | "structural"
  | "behavioral"
  | "zero";

export type PatternTone = "gold" | "info" | "danger" | "success";

export type DesignPattern = {
  id: string;
  name: string;
  shortName: string;
  displayNumber: number;
  boardNumber: number;
  category: PatternCategory;
  tone: PatternTone;
  description: string;
};

type PatternSeed = Omit<DesignPattern, "displayNumber">;

// Wheel order — tuned for color distribution (no adjacent same-color pairs).
const SEED: readonly PatternSeed[] = [
  // 0 — Zero at 12 o'clock.
  {
    id: "zero",
    name: "0",
    shortName: "0",
    boardNumber: 0,
    category: "zero",
    tone: "success",
    description:
      "La casilla cero — ventaja de la casa. Si cae, todas las apuestas activas se pierden.",
  },
  // 1 R
  {
    id: "observer",
    name: "Observer",
    shortName: "Observer",
    boardNumber: 18,
    category: "behavioral",
    tone: "danger",
    description:
      "Define una dependencia 1-a-N: cuando un sujeto cambia, todos sus observadores son notificados.",
  },
  // 2 B
  {
    id: "decorator",
    name: "Decorator",
    shortName: "Decorator",
    boardNumber: 9,
    category: "structural",
    tone: "info",
    description:
      "Añade responsabilidades a un objeto dinámicamente sin modificar su clase.",
  },
  // 3 R
  {
    id: "strategy",
    name: "Strategy",
    shortName: "Strategy",
    boardNumber: 20,
    category: "behavioral",
    tone: "danger",
    description:
      "Encapsula familias de algoritmos intercambiables para que el cliente elija el comportamiento.",
  },
  // 4 B
  {
    id: "composite",
    name: "Composite",
    shortName: "Composite",
    boardNumber: 8,
    category: "structural",
    tone: "info",
    description:
      "Compone objetos en estructuras de árbol y trata a objetos individuales y compuestos de forma uniforme.",
  },
  // 5 R
  {
    id: "visitor",
    name: "Visitor",
    shortName: "Visitor",
    boardNumber: 22,
    category: "behavioral",
    tone: "danger",
    description:
      "Separa una operación de la estructura de objetos sobre la que opera, permitiendo añadir operaciones sin tocar las clases.",
  },
  // 6 G
  {
    id: "singleton",
    name: "Singleton",
    shortName: "Singleton",
    boardNumber: 5,
    category: "creational",
    tone: "gold",
    description:
      "Garantiza una única instancia de una clase y provee un punto global de acceso a ella.",
  },
  // 7 R
  {
    id: "iterator",
    name: "Iterator",
    shortName: "Iterator",
    boardNumber: 15,
    category: "behavioral",
    tone: "danger",
    description:
      "Accede secuencialmente a los elementos de una colección sin exponer su representación interna.",
  },
  // 8 B
  {
    id: "flyweight",
    name: "Flyweight",
    shortName: "Flyweight",
    boardNumber: 11,
    category: "structural",
    tone: "info",
    description:
      "Comparte eficientemente objetos pequeños para soportar grandes cantidades en memoria.",
  },
  // 9 R
  {
    id: "memento",
    name: "Memento",
    shortName: "Memento",
    boardNumber: 17,
    category: "behavioral",
    tone: "danger",
    description:
      "Captura y externaliza el estado interno de un objeto para poder restaurarlo después sin romper su encapsulamiento.",
  },
  // 10 B
  {
    id: "proxy",
    name: "Proxy",
    shortName: "Proxy",
    boardNumber: 12,
    category: "structural",
    tone: "info",
    description:
      "Provee un sustituto o representante de otro objeto para controlar el acceso, añadir logging, lazy loading, etc.",
  },
  // 11 R
  {
    id: "template-method",
    name: "Template Method",
    shortName: "Template M.",
    boardNumber: 21,
    category: "behavioral",
    tone: "danger",
    description:
      "Define el esqueleto de un algoritmo y delega ciertos pasos a las subclases sin cambiar su estructura.",
  },
  // 12 G
  {
    id: "abstract-factory",
    name: "Abstract Factory",
    shortName: "Abstract Fct.",
    boardNumber: 1,
    category: "creational",
    tone: "gold",
    description:
      "Provee una interfaz para crear familias de objetos relacionados sin especificar sus clases concretas.",
  },
  // 13 R
  {
    id: "command",
    name: "Command",
    shortName: "Command",
    boardNumber: 14,
    category: "behavioral",
    tone: "danger",
    description:
      "Encapsula una petición como un objeto, permitiendo parametrizar, encolar, deshacer o registrar operaciones.",
  },
  // 14 B
  {
    id: "adapter",
    name: "Adapter",
    shortName: "Adapter",
    boardNumber: 6,
    category: "structural",
    tone: "info",
    description:
      "Convierte la interfaz de una clase en otra que el cliente espera, permitiendo colaborar a clases incompatibles.",
  },
  // 15 R
  {
    id: "mediator",
    name: "Mediator",
    shortName: "Mediator",
    boardNumber: 16,
    category: "behavioral",
    tone: "danger",
    description:
      "Centraliza la comunicación entre objetos para reducir acoplamiento entre ellos.",
  },
  // 16 G
  {
    id: "builder",
    name: "Builder",
    shortName: "Builder",
    boardNumber: 2,
    category: "creational",
    tone: "gold",
    description:
      "Separa la construcción de un objeto complejo de su representación, permitiendo distintas variantes del mismo proceso.",
  },
  // 17 R
  {
    id: "chain-of-responsibility",
    name: "Chain of Responsibility",
    shortName: "Chain of Resp.",
    boardNumber: 13,
    category: "behavioral",
    tone: "danger",
    description:
      "Pasa una petición por una cadena de manejadores hasta que uno la procese, desacoplando emisor y receptor.",
  },
  // 18 B
  {
    id: "bridge",
    name: "Bridge",
    shortName: "Bridge",
    boardNumber: 7,
    category: "structural",
    tone: "info",
    description:
      "Desacopla una abstracción de su implementación para que ambas puedan variar de forma independiente.",
  },
  // 19 R
  {
    id: "interpreter",
    name: "Interpreter",
    shortName: "Interpreter",
    boardNumber: 23,
    category: "behavioral",
    tone: "danger",
    description:
      "Define una representación gramatical de un lenguaje e interpreta sentencias de ese lenguaje.",
  },
  // 20 G
  {
    id: "factory-method",
    name: "Factory Method",
    shortName: "Factory M.",
    boardNumber: 3,
    category: "creational",
    tone: "gold",
    description:
      "Define una interfaz para crear un objeto, pero deja que las subclases decidan qué clase instanciar.",
  },
  // 21 R
  {
    id: "state",
    name: "State",
    shortName: "State",
    boardNumber: 19,
    category: "behavioral",
    tone: "danger",
    description:
      "Permite que un objeto altere su comportamiento cuando su estado interno cambia; parece cambiar de clase.",
  },
  // 22 B
  {
    id: "facade",
    name: "Facade",
    shortName: "Facade",
    boardNumber: 10,
    category: "structural",
    tone: "info",
    description:
      "Ofrece una interfaz unificada de alto nivel sobre un conjunto de interfaces de un subsistema.",
  },
  // 23 G — closes the ring adjacent to the zero.
  {
    id: "prototype",
    name: "Prototype",
    shortName: "Prototype",
    boardNumber: 4,
    category: "creational",
    tone: "gold",
    description:
      "Crea nuevos objetos clonando una instancia prototipo, evitando acoplarse a clases concretas.",
  },
];

// Number the wheel slots: zero → 0, others → running 1..23 in array order.
let _counter = 0;
export const PATTERNS: readonly DesignPattern[] = SEED.map((p) => ({
  ...p,
  displayNumber: p.category === "zero" ? 0 : ++_counter,
}));

export const PATTERN_COUNT = PATTERNS.length;

export const CATEGORY_LABEL: Record<PatternCategory, string> = {
  creational: "Creational",
  structural: "Structural",
  behavioral: "Behavioral",
  zero: "Cero",
};

/** Payout multipliers by bet type (winnings per 1 unit wagered). */
export const PAYOUTS = {
  pleno: 22,
  creational: 4,
  structural: 3,
  behavioral: 2,
  creaEst: 1,
  estComp: 1,
  top5: 4,
} as const;

export type PatternImageSources = { avif: string; webp: string };

/**
 * Public image sources for a pattern, or null if we don't ship art for it
 * (currently the "zero" slot is the only one without a dedicated image).
 * AVIF is the primary source; WebP is the fallback for older browsers.
 * Consumers render via a <picture> element so the browser picks whichever
 * it can decode.
 */
export function patternImagePath(
  pattern: DesignPattern,
): PatternImageSources | null {
  if (pattern.category === "zero") return null;
  return {
    avif: `/images/patterns/${pattern.id}.avif`,
    webp: `/images/patterns/${pattern.id}.webp`,
  };
}

export function getPatternByIndex(i: number): DesignPattern {
  const idx = ((i % PATTERN_COUNT) + PATTERN_COUNT) % PATTERN_COUNT;
  return PATTERNS[idx]!;
}

/** Patterns sorted by their stable board number (0..23) for the physical-
 *  board view. Skips the zero — it has its own section on the board. */
export function patternsByCategoryForBoard(): Record<
  Exclude<PatternCategory, "zero">,
  DesignPattern[]
> {
  const groups: Record<Exclude<PatternCategory, "zero">, DesignPattern[]> = {
    creational: [],
    structural: [],
    behavioral: [],
  };
  for (const p of PATTERNS) {
    if (p.category === "zero") continue;
    groups[p.category].push(p);
  }
  for (const key of Object.keys(groups) as Array<
    Exclude<PatternCategory, "zero">
  >) {
    groups[key].sort((a, b) => a.boardNumber - b.boardNumber);
  }
  return groups;
}
