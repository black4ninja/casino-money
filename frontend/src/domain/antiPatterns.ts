/**
 * Canonical anti-patterns bundled with the handbook. Each entry is a short
 * student-friendly reference — what the anti-pattern is, why it's bad, and
 * a few concrete examples students actually produce. No UML or code on
 * purpose: the images already embed the visual identity, and anti-patterns
 * are better taught by example than by formal structure.
 *
 * Image sources mirror the pattern card convention: AVIF primary + WebP
 * fallback, same 1200w base, stored under /public/images/antipatterns/.
 */

export type AntiPatternImageSources = { avif: string; webp: string };

export type AntiPattern = {
  id: string;
  name: string;
  /** One-line hook shown in the header of the back side. */
  tagline: string;
  /** Longer description shown on the card back. 2–4 sentences. */
  description: string;
  /** Concrete examples students run into. 3–5 bullets. */
  examples: readonly string[];
  /** How to pivot out of it into a better shape. 2–3 bullets. */
  remedies: readonly string[];
};

export const ANTI_PATTERNS: readonly AntiPattern[] = [
  {
    id: "god-object",
    name: "God Object",
    tagline: "Una clase lo sabe todo y lo hace todo.",
    description:
      "Un objeto (o módulo) acumula tantas responsabilidades que se vuelve imposible de mantener, probar o entender. Cada cambio toca todo; cada bug se esconde entre miles de líneas. Suele aparecer por crecimiento descontrolado sin refactor.",
    examples: [
      "Un `UserManager` con 3.000 líneas que maneja auth, perfil, email, billing y logs.",
      "Un `app.js` de 10.000 líneas donde vive toda la lógica del backend.",
      "Un controlador de UI que también hace fetch, valida, transforma y renderiza.",
      "Un singleton 'Utils' que termina siendo la mitad del código base.",
    ],
    remedies: [
      "Identificar responsabilidades y extraer clases enfocadas (SRP).",
      "Aplicar Facade para orquestar sin absorber las responsabilidades.",
      "Dividir por dominios / bounded contexts en vez de por capas genéricas.",
    ],
  },
  {
    id: "spaghetti-code",
    name: "Spaghetti Code",
    tagline: "Control de flujo imposible de seguir.",
    description:
      "Código sin estructura clara: saltos, condicionales anidados, variables globales y dependencias cruzadas que convierten cualquier bug en un laberinto. Clásico de proyectos sin patrones ni revisión de código.",
    examples: [
      "Condicionales `if/else` anidados 6 niveles de profundidad.",
      "Funciones de 400 líneas con `goto`-style vía flags y `continue`.",
      "Estado mutable global que cualquier función puede modificar.",
      "Handlers que cambian variables de otros handlers sin aviso.",
    ],
    remedies: [
      "Extraer funciones pequeñas con una sola responsabilidad.",
      "Early returns para reducir anidación.",
      "Máquinas de estado (patrón State) para flujos complejos.",
    ],
  },
  {
    id: "copy-paste",
    name: "Copy-Paste Programming",
    tagline: "Duplicar en vez de abstraer.",
    description:
      "Se copia un bloque de código de un lado a otro con pequeñas modificaciones en vez de extraer una función o componente reutilizable. El bug que había en el original ahora existe en cinco lugares — y se arregla en uno solo.",
    examples: [
      "El mismo `validateEmail` con regex ligeramente distintos en 4 archivos.",
      "Un componente de tabla pegado en 10 páginas con variaciones mínimas.",
      "Query SQL repetida en cada handler en vez de un repositorio.",
      "Funciones que difieren solo en un string constante.",
    ],
    remedies: [
      "Extraer función o componente con parámetros para las variaciones.",
      "DRY: si lo escribiste 3 veces, abstráelo.",
      "Strategy pattern cuando las diferencias son algorítmicas.",
    ],
  },
  {
    id: "lava-flow",
    name: "Lava Flow",
    tagline: "Código muerto que nadie se atreve a borrar.",
    description:
      "Código obsoleto, features descontinuadas, flags antiguos y utilidades sin uso que permanecen en el repo 'por si acaso'. Con el tiempo, el código vivo queda enterrado bajo capas de magma fósil que ya nadie entiende.",
    examples: [
      "Carpetas `legacy/`, `old/`, `backup/` con archivos de hace 3 años.",
      "Funciones exportadas que nadie importa pero nadie borra.",
      "Feature flags al 100% desde hace 2 años sin limpiar.",
      "Comentarios tipo `// TODO: remove after launch` de 2019.",
    ],
    remedies: [
      "Auditoría periódica: borrar lo muerto (el git history lo guarda).",
      "Sunset explícito de flags y features.",
      "Herramientas como knip, ts-prune o unimported para detectar código huérfano.",
    ],
  },
  {
    id: "over-engineering",
    name: "Over-Engineering",
    tagline: "Resolver problemas que nadie tiene.",
    description:
      "Añadir capas de abstracción, patrones y configuración para cubrir requisitos hipotéticos que quizás nunca aparezcan. El resultado es código que cuesta el doble mantener para una flexibilidad que nadie usa.",
    examples: [
      "Una factoría abstracta con un solo producto concreto.",
      "Sistema de plugins para una app que siempre va a hacer una sola cosa.",
      "DSL propia para expresar reglas que cambian una vez al año.",
      "Configuración externa para valores que son literalmente constantes.",
    ],
    remedies: [
      "YAGNI: agregá abstracción solo cuando te duela su ausencia.",
      "Empezá con lo más simple que funcione, refactorizá cuando llegue el segundo caso.",
      "Preguntá 'qué pasa si lo quito' antes de añadirlo.",
    ],
  },
  {
    id: "golden-hammer",
    name: "Golden Hammer",
    tagline: "Si tu única herramienta es un martillo, todo parece clavo.",
    description:
      "Aplicar la misma tecnología, patrón o librería a cualquier problema porque es la que conocés, sin evaluar si es apropiada. Termina forzando soluciones incómodas por comodidad del que las escribe, no por fit del problema.",
    examples: [
      "Usar Redux para una app con 2 estados que viven en un componente.",
      "Microservicios para un proyecto de 3 endpoints.",
      "MongoDB para datos fuertemente relacionales.",
      "Programación funcional pura donde una clase simple resolvía todo.",
    ],
    remedies: [
      "Evaluar la herramienta contra el problema, no a la inversa.",
      "Mantener un menú mental de opciones y sus trade-offs.",
      "Permitir diversidad tecnológica donde el costo está justificado.",
    ],
  },
];

export const ANTI_PATTERN_COUNT = ANTI_PATTERNS.length;

/**
 * Public image sources for an anti-pattern. Same AVIF+WebP convention as
 * `patternImagePath` so consumers can render with a single <picture>.
 */
export function antiPatternImagePath(
  ap: AntiPattern,
): AntiPatternImageSources {
  return {
    avif: `/images/antipatterns/${ap.id}.avif`,
    webp: `/images/antipatterns/${ap.id}.webp`,
  };
}
