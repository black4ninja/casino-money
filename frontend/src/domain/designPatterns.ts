/**
 * The 23 slots of the pattern roulette — kept in the exact order the user
 * requested so that the classroom-facing wheel matches what they presented.
 * The special slot at index 14 is the roulette "zero" (category: "zero").
 *
 * `tone` matches the Badge/Chip color system used elsewhere:
 *   gold    → Creational
 *   info    → Structural   (blue)
 *   danger  → Behavioral   (red)
 *   success → Zero         (green, traditional)
 *
 * `displayNumber` is what's painted on the wheel slot: 0 for the zero slot,
 * 1..22 for the other slots in the order they appear below. Names are too
 * long to render legibly on a 23-slice wheel at any reasonable diameter, so
 * the wheel shows numbers and the page shows a key next to it.
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
  {
    id: "singleton",
    name: "Singleton",
    shortName: "Singleton",
    category: "creational",
    tone: "gold",
    description:
      "Garantiza una única instancia de una clase y provee un punto global de acceso a ella.",
  },
  {
    id: "decorator",
    name: "Decorator",
    shortName: "Decorator",
    category: "structural",
    tone: "info",
    description:
      "Añade responsabilidades a un objeto dinámicamente sin modificar su clase.",
  },
  {
    id: "observer",
    name: "Observer",
    shortName: "Observer",
    category: "behavioral",
    tone: "danger",
    description:
      "Define una dependencia 1-a-N: cuando un sujeto cambia, todos sus observadores son notificados.",
  },
  {
    id: "strategy",
    name: "Strategy",
    shortName: "Strategy",
    category: "behavioral",
    tone: "danger",
    description:
      "Encapsula familias de algoritmos intercambiables para que el cliente elija el comportamiento.",
  },
  {
    id: "visitor",
    name: "Visitor",
    shortName: "Visitor",
    category: "behavioral",
    tone: "danger",
    description:
      "Separa una operación de la estructura de objetos sobre la que opera, permitiendo añadir operaciones sin tocar las clases.",
  },
  {
    id: "iterator",
    name: "Iterator",
    shortName: "Iterator",
    category: "behavioral",
    tone: "danger",
    description:
      "Accede secuencialmente a los elementos de una colección sin exponer su representación interna.",
  },
  {
    id: "composite",
    name: "Composite",
    shortName: "Composite",
    category: "structural",
    tone: "info",
    description:
      "Compone objetos en estructuras de árbol y trata a objetos individuales y compuestos de forma uniforme.",
  },
  {
    id: "memento",
    name: "Memento",
    shortName: "Memento",
    category: "behavioral",
    tone: "danger",
    description:
      "Captura y externaliza el estado interno de un objeto para poder restaurarlo después sin romper su encapsulamiento.",
  },
  {
    id: "abstract-factory",
    name: "Abstract Factory",
    shortName: "Abstract Fct.",
    category: "creational",
    tone: "gold",
    description:
      "Provee una interfaz para crear familias de objetos relacionados sin especificar sus clases concretas.",
  },
  {
    id: "builder",
    name: "Builder",
    shortName: "Builder",
    category: "creational",
    tone: "gold",
    description:
      "Separa la construcción de un objeto complejo de su representación, permitiendo distintas variantes del mismo proceso.",
  },
  {
    id: "flyweight",
    name: "Flyweight",
    shortName: "Flyweight",
    category: "structural",
    tone: "info",
    description:
      "Comparte eficientemente objetos pequeños para soportar grandes cantidades en memoria.",
  },
  {
    id: "template-method",
    name: "Template Method",
    shortName: "Template M.",
    category: "behavioral",
    tone: "danger",
    description:
      "Define el esqueleto de un algoritmo y delega ciertos pasos a las subclases sin cambiar su estructura.",
  },
  {
    id: "factory-method",
    name: "Factory Method",
    shortName: "Factory M.",
    category: "creational",
    tone: "gold",
    description:
      "Define una interfaz para crear un objeto, pero deja que las subclases decidan qué clase instanciar.",
  },
  {
    id: "command",
    name: "Command",
    shortName: "Command",
    category: "behavioral",
    tone: "danger",
    description:
      "Encapsula una petición como un objeto, permitiendo parametrizar, encolar, deshacer o registrar operaciones.",
  },
  {
    id: "zero",
    name: "0",
    shortName: "0",
    category: "zero",
    tone: "success",
    description:
      "La casilla cero — tradicional en la ruleta. Usa este slot como comodín para elegir libremente.",
  },
  {
    id: "proxy",
    name: "Proxy",
    shortName: "Proxy",
    category: "structural",
    tone: "info",
    description:
      "Provee un sustituto o representante de otro objeto para controlar el acceso, añadir logging, lazy loading, etc.",
  },
  {
    id: "adapter",
    name: "Adapter",
    shortName: "Adapter",
    category: "structural",
    tone: "info",
    description:
      "Convierte la interfaz de una clase en otra que el cliente espera, permitiendo colaborar a clases incompatibles.",
  },
  {
    id: "bridge",
    name: "Bridge",
    shortName: "Bridge",
    category: "structural",
    tone: "info",
    description:
      "Desacopla una abstracción de su implementación para que ambas puedan variar de forma independiente.",
  },
  {
    id: "prototype",
    name: "Prototype",
    shortName: "Prototype",
    category: "creational",
    tone: "gold",
    description:
      "Crea nuevos objetos clonando una instancia prototipo, evitando acoplarse a clases concretas.",
  },
  {
    id: "facade",
    name: "Facade",
    shortName: "Facade",
    category: "structural",
    tone: "info",
    description:
      "Ofrece una interfaz unificada de alto nivel sobre un conjunto de interfaces de un subsistema.",
  },
  {
    id: "mediator",
    name: "Mediator",
    shortName: "Mediator",
    category: "behavioral",
    tone: "danger",
    description:
      "Centraliza la comunicación entre objetos para reducir acoplamiento entre ellos.",
  },
  {
    id: "chain-of-responsibility",
    name: "Chain of Responsibility",
    shortName: "Chain of Resp.",
    category: "behavioral",
    tone: "danger",
    description:
      "Pasa una petición por una cadena de manejadores hasta que uno la procese, desacoplando emisor y receptor.",
  },
  {
    id: "state",
    name: "State",
    shortName: "State",
    category: "behavioral",
    tone: "danger",
    description:
      "Permite que un objeto altere su comportamiento cuando su estado interno cambia; parece cambiar de clase.",
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
