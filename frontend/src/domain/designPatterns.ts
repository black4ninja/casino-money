/**
 * The 23 slots of the pattern roulette. Order is tuned to mimic a traditional
 * European roulette wheel layout: the zero sits at 12 o'clock and the rest
 * are distributed so that adjacent slots almost always have different colors.
 *
 * With 10 behavioral (red) + 7 structural (blue) + 5 creational (gold) + 1
 * zero (green) this achieves ZERO adjacent same-color pairs around the full
 * 23-slot ring (checked wrap-around from slot 22 back to slot 0).
 *
 * `tone` matches the Badge/Chip color system used elsewhere:
 *   gold    → Creational
 *   info    → Structural   (blue)
 *   danger  → Behavioral   (red)
 *   success → Zero         (green, traditional)
 *
 * `displayNumber` is computed post-declaration: 0 for the zero slot, and
 * 1..22 for the remaining slots in the order they appear below.
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
  category: PatternCategory;
  tone: PatternTone;
  description: string;
};

type PatternSeed = Omit<DesignPattern, "displayNumber">;

const SEED: readonly PatternSeed[] = [
  // Position 0 — Zero sits at 12 o'clock (traditional).
  {
    id: "zero",
    name: "0",
    shortName: "0",
    category: "zero",
    tone: "success",
    description:
      "La casilla cero — tradicional en la ruleta. Usa este slot como comodín para elegir libremente.",
  },
  // 1 R
  {
    id: "observer",
    name: "Observer",
    shortName: "Observer",
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
    category: "behavioral",
    tone: "danger",
    description:
      "Separa una operación de la estructura de objetos sobre la que opera, permitiendo añadir operaciones sin tocar las clases.",
  },
  // 6 B
  {
    id: "flyweight",
    name: "Flyweight",
    shortName: "Flyweight",
    category: "structural",
    tone: "info",
    description:
      "Comparte eficientemente objetos pequeños para soportar grandes cantidades en memoria.",
  },
  // 7 R
  {
    id: "iterator",
    name: "Iterator",
    shortName: "Iterator",
    category: "behavioral",
    tone: "danger",
    description:
      "Accede secuencialmente a los elementos de una colección sin exponer su representación interna.",
  },
  // 8 G
  {
    id: "singleton",
    name: "Singleton",
    shortName: "Singleton",
    category: "creational",
    tone: "gold",
    description:
      "Garantiza una única instancia de una clase y provee un punto global de acceso a ella.",
  },
  // 9 R
  {
    id: "memento",
    name: "Memento",
    shortName: "Memento",
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
    category: "structural",
    tone: "info",
    description:
      "Desacopla una abstracción de su implementación para que ambas puedan variar de forma independiente.",
  },
  // 19 G
  {
    id: "factory-method",
    name: "Factory Method",
    shortName: "Factory M.",
    category: "creational",
    tone: "gold",
    description:
      "Define una interfaz para crear un objeto, pero deja que las subclases decidan qué clase instanciar.",
  },
  // 20 R
  {
    id: "state",
    name: "State",
    shortName: "State",
    category: "behavioral",
    tone: "danger",
    description:
      "Permite que un objeto altere su comportamiento cuando su estado interno cambia; parece cambiar de clase.",
  },
  // 21 B
  {
    id: "facade",
    name: "Facade",
    shortName: "Facade",
    category: "structural",
    tone: "info",
    description:
      "Ofrece una interfaz unificada de alto nivel sobre un conjunto de interfaces de un subsistema.",
  },
  // 22 G — closes the ring (adjacent to the zero at slot 0).
  {
    id: "prototype",
    name: "Prototype",
    shortName: "Prototype",
    category: "creational",
    tone: "gold",
    description:
      "Crea nuevos objetos clonando una instancia prototipo, evitando acoplarse a clases concretas.",
  },
];

// Number the slots: zero → 0, others → running 1..22 in array order.
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

export function getPatternByIndex(i: number): DesignPattern {
  const idx = ((i % PATTERN_COUNT) + PATTERN_COUNT) % PATTERN_COUNT;
  return PATTERNS[idx]!;
}
