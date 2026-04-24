/**
 * Catálogo didáctico de la Carrera de Patrones. Fuente de verdad en el
 * backend; el frontend re-declara etiquetas paralelas para render, pero la
 * simulación (outcome, bonuses, payouts) vive SIEMPRE aquí para que nadie
 * pueda adivinar ni manipular resultados desde el cliente.
 *
 * Tema pedagógico: cada carrera plantea un problema de diseño y los patrones
 * que compiten ganan o pierden según qué tan bien lo resuelven (afinidad).
 * Los alumnos aprenden "no hay patrón universal, depende del problema".
 */

export type PatternId =
  // Creational
  | "singleton"
  | "factory"
  | "abstract_factory"
  | "builder"
  | "prototype"
  // Structural
  | "adapter"
  | "bridge"
  | "composite"
  | "decorator"
  | "facade"
  | "flyweight"
  | "proxy"
  // Behavioral
  | "chain_of_responsibility"
  | "command"
  | "iterator"
  | "mediator"
  | "memento"
  | "observer"
  | "state"
  | "strategy"
  | "template_method"
  | "visitor"
  // Anti-patrones — a veces entran como "dark horses".
  | "god_object"
  | "spaghetti"
  | "copy_paste";

export type PatternKind = "creational" | "behavioral" | "structural" | "anti";

export type PatternSpec = {
  id: PatternId;
  label: string;
  kind: PatternKind;
  /** Emoji/icono corto para render en proyección. */
  emoji: string;
};

export const PATTERNS: readonly PatternSpec[] = [
  // Creational
  { id: "singleton", label: "Singleton", kind: "creational", emoji: "👑" },
  { id: "factory", label: "Factory", kind: "creational", emoji: "🏭" },
  { id: "abstract_factory", label: "Abstract Factory", kind: "creational", emoji: "🏗️" },
  { id: "builder", label: "Builder", kind: "creational", emoji: "🧱" },
  { id: "prototype", label: "Prototype", kind: "creational", emoji: "🧬" },
  // Structural
  { id: "adapter", label: "Adapter", kind: "structural", emoji: "🔌" },
  { id: "bridge", label: "Bridge", kind: "structural", emoji: "🌉" },
  { id: "composite", label: "Composite", kind: "structural", emoji: "🌳" },
  { id: "decorator", label: "Decorator", kind: "structural", emoji: "🎀" },
  { id: "facade", label: "Facade", kind: "structural", emoji: "🎭" },
  { id: "flyweight", label: "Flyweight", kind: "structural", emoji: "🪶" },
  { id: "proxy", label: "Proxy", kind: "structural", emoji: "🚪" },
  // Behavioral
  { id: "chain_of_responsibility", label: "Chain of Resp.", kind: "behavioral", emoji: "🔗" },
  { id: "command", label: "Command", kind: "behavioral", emoji: "🎬" },
  { id: "iterator", label: "Iterator", kind: "behavioral", emoji: "🔁" },
  { id: "mediator", label: "Mediator", kind: "behavioral", emoji: "🕊️" },
  { id: "memento", label: "Memento", kind: "behavioral", emoji: "💾" },
  { id: "observer", label: "Observer", kind: "behavioral", emoji: "📡" },
  { id: "state", label: "State", kind: "behavioral", emoji: "🎛️" },
  { id: "strategy", label: "Strategy", kind: "behavioral", emoji: "♟️" },
  { id: "template_method", label: "Template Method", kind: "behavioral", emoji: "📐" },
  { id: "visitor", label: "Visitor", kind: "behavioral", emoji: "🎒" },
  // Anti-patterns
  { id: "god_object", label: "God Object", kind: "anti", emoji: "💀" },
  { id: "spaghetti", label: "Spaghetti", kind: "anti", emoji: "🍝" },
  { id: "copy_paste", label: "Copy-Paste", kind: "anti", emoji: "📋" },
];

export const PATTERN_IDS: readonly PatternId[] = PATTERNS.map((p) => p.id);

export function findPattern(id: string): PatternSpec | null {
  return PATTERNS.find((p) => p.id === id) ?? null;
}

export function isPatternId(value: unknown): value is PatternId {
  return (
    typeof value === "string" && (PATTERN_IDS as readonly string[]).includes(value)
  );
}

export type ProblemId =
  // Creacionales (11 — 1 existente + 10 nuevos)
  | "mass_creation"
  | "single_instance"
  | "step_by_step_build"
  | "shared_config_registry"
  | "central_cache_single"
  | "plugin_loading"
  | "family_of_related_objects"
  | "cross_platform_ui_kit"
  | "fluent_api_for_query"
  | "immutable_complex_obj"
  | "expensive_object_copy"
  | "editor_clipboard_copy"
  // Estructurales (16 — 3 existentes + 13 nuevos)
  | "integrate_legacy"
  | "simplify_subsystem"
  | "dynamic_behavior_add"
  | "third_party_api_wrap"
  | "protocol_conversion"
  | "decouple_abstraction_impl"
  | "cross_platform_file_access"
  | "tree_structure_uniform"
  | "hierarchical_menu"
  | "scene_graph_3d"
  | "stream_processing"
  | "shopping_cart_promotions"
  | "logger_with_formats"
  | "third_party_lib_facade"
  | "massive_duplicate_data"
  | "text_editor_glyphs"
  | "game_sprites"
  | "access_control_remote"
  | "caching_remote_calls"
  | "lazy_expensive_init"
  // Comportamiento (33 — 4 existentes + 27 nuevos)
  | "event_broadcast"
  | "module_coordination"
  | "algorithm_swap"
  | "lifecycle_states"
  | "request_chain_handlers"
  | "middleware_pipeline"
  | "log_level_filtering"
  | "authorization_workflow"
  | "undo_redo_actions"
  | "macro_recording"
  | "transactional_actions"
  | "traverse_collection_uniform"
  | "chat_room_backend"
  | "form_coordination"
  | "snapshot_rollback"
  | "notification_system"
  | "workflow_state_machine"
  | "payment_gateway_switch"
  | "sorting_runtime_choice"
  | "localization_system"
  | "compression_algorithms"
  | "auth_multi_provider"
  | "report_generation_pipeline"
  | "framework_hook_points"
  | "fixed_skeleton_variable_steps"
  | "ast_traversal"
  | "add_ops_without_modify"
  | "report_over_hierarchy";

export type ProblemSpec = {
  id: ProblemId;
  /** Enunciado corto para proyección. */
  statement: string;
  /** Tip didáctico (ok revelarlo después del "¿quién creen que gana?"). */
  hint: string;
  /**
   * Tabla de afinidad: bonus sumado a cada tick de cada patrón. Entre mayor,
   * más rápido avanza. Un patrón ausente de la tabla recibe bonus 0.
   *
   * Diseño: 0..+5. El "ideal" va a +5, el "buen segundo" a +3-4, y los
   * mismatches se quedan en 0 (solo azar). Anti-patrones aparecen con bonus
   * alto pero con penalización (ver computeRace).
   */
  bonuses: Partial<Record<PatternId, number>>;
};

export const PROBLEMS: readonly ProblemSpec[] = [
  {
    id: "mass_creation",
    statement: "Necesitas crear muchos objetos de tipos relacionados sin acoplar el código que los usa.",
    hint: "Suena a fábrica.",
    bonuses: { factory: 5, builder: 3, singleton: 1, decorator: 1 },
  },
  {
    id: "single_instance",
    statement: "Requieres una única instancia global coordinando el sistema.",
    hint: "Uno y solo uno.",
    bonuses: { singleton: 5, facade: 2, mediator: 2 },
  },
  {
    id: "step_by_step_build",
    statement: "Debes armar un objeto complejo en múltiples pasos con variantes.",
    hint: "Paso a paso.",
    bonuses: { builder: 5, factory: 3, decorator: 2 },
  },
  {
    id: "event_broadcast",
    statement: "Muchos componentes deben reaccionar cuando cambia un estado.",
    hint: "Suscríbete.",
    bonuses: { observer: 5, mediator: 3, state: 1 },
  },
  {
    id: "module_coordination",
    statement: "Módulos distintos se hablan demasiado; hay que centralizar la coordinación.",
    hint: "Un árbitro.",
    bonuses: { mediator: 5, facade: 3, observer: 2 },
  },
  {
    id: "algorithm_swap",
    statement: "Necesitas cambiar el algoritmo en tiempo de ejecución sin condicionales gigantes.",
    hint: "Intercambiable.",
    bonuses: { strategy: 5, state: 3, factory: 1 },
  },
  {
    id: "lifecycle_states",
    statement: "El comportamiento debe cambiar según el estado interno del objeto.",
    hint: "Transiciones limpias.",
    bonuses: { state: 5, strategy: 3, observer: 1 },
  },
  {
    id: "integrate_legacy",
    statement: "Debes integrar un sistema con una interfaz incompatible sin tocar el viejo.",
    hint: "Traductor.",
    bonuses: { adapter: 5, facade: 3, decorator: 1 },
  },
  {
    id: "simplify_subsystem",
    statement: "Un subsistema enorme necesita una puerta de entrada simple para el resto.",
    hint: "Fachada.",
    bonuses: { facade: 5, mediator: 3, adapter: 2 },
  },
  {
    id: "dynamic_behavior_add",
    statement: "Quieres añadir responsabilidades a objetos dinámicamente sin herencia explosiva.",
    hint: "Envuélvelo.",
    bonuses: { decorator: 5, strategy: 3, adapter: 2 },
  },

  // ════════════════════════════════════════════════════════════════════
  // Creacionales adicionales
  // ════════════════════════════════════════════════════════════════════
  {
    id: "shared_config_registry",
    statement: "Varios módulos necesitan leer la misma configuración global sin duplicarla.",
    hint: "Un punto de acceso único.",
    bonuses: { singleton: 5, facade: 3, proxy: 2 },
  },
  {
    id: "central_cache_single",
    statement: "Necesitas un caché central que TODOS los componentes consulten.",
    hint: "Un solo caché compartido.",
    bonuses: { singleton: 5, proxy: 4, flyweight: 2 },
  },
  {
    id: "plugin_loading",
    statement: "El sistema debe cargar plugins desconocidos al inicio sin acoplarse a sus clases concretas.",
    hint: "Descubre y fabrica.",
    bonuses: { factory: 5, abstract_factory: 3, strategy: 2 },
  },
  {
    id: "family_of_related_objects",
    statement: "Debes crear familias de objetos relacionados (botones, cajas, menús) que deben combinarse entre sí.",
    hint: "Familias que encajan.",
    bonuses: { abstract_factory: 5, factory: 3, builder: 2 },
  },
  {
    id: "cross_platform_ui_kit",
    statement: "Construye widgets que se adapten a Windows, macOS y Linux con el mismo código cliente.",
    hint: "Kit por plataforma.",
    bonuses: { abstract_factory: 5, bridge: 3, strategy: 2 },
  },
  {
    id: "fluent_api_for_query",
    statement: "Quieres una API estilo query.where(...).orderBy(...).limit(...) para armar consultas paso a paso.",
    hint: "Encadena llamadas.",
    bonuses: { builder: 5, strategy: 2 },
  },
  {
    id: "immutable_complex_obj",
    statement: "Debes construir un objeto inmutable con muchos campos opcionales sin constructor telescópico.",
    hint: "Arma y sella.",
    bonuses: { builder: 5, prototype: 3, factory: 2 },
  },
  {
    id: "expensive_object_copy",
    statement: "Clonar objetos es más barato que crearlos desde cero (configuraciones ya parseadas, conexiones calientes).",
    hint: "Mejor clonar.",
    bonuses: { prototype: 5, flyweight: 2, singleton: 1 },
  },
  {
    id: "editor_clipboard_copy",
    statement: "Copiar/pegar nodos arbitrarios de un editor preservando estructura y referencias.",
    hint: "Clona el subárbol.",
    bonuses: { prototype: 5, memento: 3, composite: 3 },
  },

  // ════════════════════════════════════════════════════════════════════
  // Estructurales adicionales
  // ════════════════════════════════════════════════════════════════════
  {
    id: "third_party_api_wrap",
    statement: "Una librería externa expone una interfaz fea; quieres mostrar una propia más limpia a tu código.",
    hint: "Envuélvela.",
    bonuses: { adapter: 5, facade: 4, decorator: 2 },
  },
  {
    id: "protocol_conversion",
    statement: "Comunicar módulos que hablan JSON con módulos que solo aceptan XML.",
    hint: "Traduce en la frontera.",
    bonuses: { adapter: 5, facade: 2, proxy: 1 },
  },
  {
    id: "decouple_abstraction_impl",
    statement: "Tienes 3 tipos de reporte × 4 formatos de export: quieres evitar 12 clases separadas.",
    hint: "Separa qué de cómo.",
    bonuses: { bridge: 5, strategy: 3, abstract_factory: 2 },
  },
  {
    id: "cross_platform_file_access",
    statement: "Mismo código de alto nivel accediendo a archivos locales, S3 y FTP sin saber cuál es cuál.",
    hint: "Puente entre abstracción e implementación.",
    bonuses: { bridge: 5, adapter: 3, strategy: 2 },
  },
  {
    id: "tree_structure_uniform",
    statement: "Debes tratar nodos individuales y composiciones de nodos con exactamente la misma API.",
    hint: "Todo es nodo.",
    bonuses: { composite: 5, iterator: 2 },
  },
  {
    id: "hierarchical_menu",
    statement: "Menús con submenús con submenús donde todos responden al mismo render() y onClick().",
    hint: "Composición recursiva.",
    bonuses: { composite: 5, decorator: 2 },
  },
  {
    id: "scene_graph_3d",
    statement: "Objetos 3D, grupos y luces que heredan transforms del padre sin acoplarse.",
    hint: "Árbol de escena.",
    bonuses: { composite: 5, visitor: 4, iterator: 2 },
  },
  {
    id: "stream_processing",
    statement: "Leer un archivo aplicando decompresión, decodificación y decifrado en cadena.",
    hint: "Capas sobre un stream.",
    bonuses: { decorator: 5, chain_of_responsibility: 3, adapter: 1 },
  },
  {
    id: "shopping_cart_promotions",
    statement: "Los descuentos se apilan: 2x1 + cupón + envío gratis, todos modifican el total.",
    hint: "Envuelve el precio.",
    bonuses: { decorator: 5, strategy: 4, chain_of_responsibility: 3 },
  },
  {
    id: "logger_with_formats",
    statement: "Logger que puede agregar timestamp, color, JSON, o enviarse a archivo Y consola.",
    hint: "Capas opcionales.",
    bonuses: { decorator: 5, strategy: 3, chain_of_responsibility: 2 },
  },
  {
    id: "third_party_lib_facade",
    statement: "Envolver una lib enorme de reporting exponiendo solo 3 métodos comunes al resto del código.",
    hint: "Oculta complejidad.",
    bonuses: { facade: 5, adapter: 3 },
  },
  {
    id: "massive_duplicate_data",
    statement: "Un millón de celdas de hoja de cálculo comparten solo 30 estilos distintos.",
    hint: "Comparte lo inmutable.",
    bonuses: { flyweight: 5, singleton: 2 },
  },
  {
    id: "text_editor_glyphs",
    statement: "Renderizar un documento con miles de caracteres donde cada letra es costosa de crear.",
    hint: "Una letra, muchos usos.",
    bonuses: { flyweight: 5, composite: 2 },
  },
  {
    id: "game_sprites",
    statement: "El juego muestra 5 000 árboles; cada uno es idéntico excepto por su posición.",
    hint: "Estado intrínseco compartido.",
    bonuses: { flyweight: 5, prototype: 2 },
  },
  {
    id: "access_control_remote",
    statement: "Cada llamada a un servicio remoto debe verificar permisos antes de ejecutarse.",
    hint: "Guardián de entrada.",
    bonuses: { proxy: 5, chain_of_responsibility: 3, decorator: 2 },
  },
  {
    id: "caching_remote_calls",
    statement: "Llamadas a una API externa se repiten seguido; deben reusar el resultado si es reciente.",
    hint: "Interceptor que recuerda.",
    bonuses: { proxy: 5, decorator: 3, flyweight: 1 },
  },
  {
    id: "lazy_expensive_init",
    statement: "Un objeto pesado solo debe crearse cuando realmente se use por primera vez.",
    hint: "Construye a demanda.",
    bonuses: { proxy: 5, singleton: 3, factory: 1 },
  },

  // ════════════════════════════════════════════════════════════════════
  // Comportamiento adicionales
  // ════════════════════════════════════════════════════════════════════
  {
    id: "request_chain_handlers",
    statement: "Una petición debe pasar por auth → rate-limit → validación → handler; cada paso puede cortarla.",
    hint: "Pásala al siguiente.",
    bonuses: { chain_of_responsibility: 5, decorator: 2 },
  },
  {
    id: "middleware_pipeline",
    statement: "Cada middleware HTTP recibe la request, la modifica y decide si seguir o cortar.",
    hint: "Pipeline de handlers.",
    bonuses: { chain_of_responsibility: 5, decorator: 4 },
  },
  {
    id: "log_level_filtering",
    statement: "Los logs pasan por niveles DEBUG → INFO → WARN → ERROR hasta que alguien los captura.",
    hint: "Escalado de responsabilidad.",
    bonuses: { chain_of_responsibility: 5, strategy: 2 },
  },
  {
    id: "authorization_workflow",
    statement: "Permisos multi-nivel: usuario → rol → departamento → empresa; cada uno puede aprobar o denegar.",
    hint: "Jerarquía de permisos.",
    bonuses: { chain_of_responsibility: 5, strategy: 2, state: 1 },
  },
  {
    id: "undo_redo_actions",
    statement: "Toda acción del editor debe poder deshacerse y rehacerse sin pérdida de datos.",
    hint: "Acción encapsulada.",
    bonuses: { command: 5, memento: 3 },
  },
  {
    id: "macro_recording",
    statement: "Grabar una secuencia de acciones del usuario y reproducirla después tal cual.",
    hint: "Acciones como datos.",
    bonuses: { command: 5, memento: 2 },
  },
  {
    id: "transactional_actions",
    statement: "Una serie de pasos debe ejecutarse toda o revertirse toda si alguno falla.",
    hint: "Ejecuta como objeto.",
    bonuses: { command: 5, memento: 3, chain_of_responsibility: 2 },
  },
  {
    id: "traverse_collection_uniform",
    statement: "Recorrer listas, árboles y grafos con la misma sintaxis `for ... of`.",
    hint: "Cursor sobre estructura.",
    bonuses: { iterator: 5, composite: 2 },
  },
  {
    id: "chat_room_backend",
    statement: "En un chat, cada mensaje debe distribuirse a todos pero los clientes NO se hablan entre sí.",
    hint: "Un árbitro central.",
    bonuses: { mediator: 5, observer: 3 },
  },
  {
    id: "form_coordination",
    statement: "Un formulario donde cambiar un campo habilita/deshabilita otros sin acoplarlos.",
    hint: "Coordina sin acoplar.",
    bonuses: { mediator: 5, observer: 3, state: 2 },
  },
  {
    id: "snapshot_rollback",
    statement: "Guardar el estado actual del documento y poder restaurarlo exactamente igual después.",
    hint: "Foto del estado.",
    bonuses: { memento: 5, command: 3, prototype: 3 },
  },
  {
    id: "notification_system",
    statement: "Suscriptores reciben alertas cuando cambia un precio, sin que el emisor los conozca.",
    hint: "Publica-suscríbete.",
    bonuses: { observer: 5, mediator: 3 },
  },
  {
    id: "workflow_state_machine",
    statement: "Un pedido pasa por: nuevo → pagado → enviado → entregado, con transiciones legales específicas.",
    hint: "Estados + transiciones.",
    bonuses: { state: 5, strategy: 2, command: 1 },
  },
  {
    id: "payment_gateway_switch",
    statement: "Debes aceptar Stripe, PayPal y Mercado Pago; cada uno con su flujo pero la misma UX.",
    hint: "Algoritmo intercambiable.",
    bonuses: { strategy: 5, adapter: 4, abstract_factory: 2 },
  },
  {
    id: "sorting_runtime_choice",
    statement: "El usuario elige ordenar por fecha, nombre o relevancia desde un dropdown.",
    hint: "Comparador enchufable.",
    bonuses: { strategy: 5 },
  },
  {
    id: "localization_system",
    statement: "Cambiar entre diccionarios en-US, es-MX, pt-BR en runtime sin `if`s esparcidos por todos lados.",
    hint: "Catálogo por idioma.",
    bonuses: { strategy: 5, factory: 2, flyweight: 1 },
  },
  {
    id: "compression_algorithms",
    statement: "Archivos pueden comprimirse con ZIP, GZIP o LZ4 según el contexto — el caller no debería saberlo.",
    hint: "Algoritmo como objeto.",
    bonuses: { strategy: 5 },
  },
  {
    id: "auth_multi_provider",
    statement: "Login con email+password, Google, GitHub o SSO corporativo; misma sesión final.",
    hint: "Varios caminos, misma meta.",
    bonuses: { strategy: 5, chain_of_responsibility: 3, factory: 2 },
  },
  {
    id: "report_generation_pipeline",
    statement: "Todos los reportes siguen el mismo esqueleto (cargar → transformar → formatear → exportar); solo varían pasos intermedios.",
    hint: "Esqueleto fijo, pasos variables.",
    bonuses: { template_method: 5, strategy: 3, chain_of_responsibility: 2 },
  },
  {
    id: "framework_hook_points",
    statement: "Un framework define el flujo completo y expone puntos específicos donde el dev inserta código propio.",
    hint: "Don't call us, we call you.",
    bonuses: { template_method: 5, observer: 2 },
  },
  {
    id: "fixed_skeleton_variable_steps",
    statement: "El flujo de onboarding es siempre igual pero cada tenant personaliza 2 de los 8 pasos.",
    hint: "Esqueleto + ganchos.",
    bonuses: { template_method: 5, strategy: 3 },
  },
  {
    id: "ast_traversal",
    statement: "Necesitas recorrer un AST aplicando transformaciones distintas (linting, minificación, source-maps) sin tocar las clases de nodo.",
    hint: "Operación externa sobre estructura.",
    bonuses: { visitor: 5, composite: 4, iterator: 2 },
  },
  {
    id: "add_ops_without_modify",
    statement: "Debes añadir nuevas operaciones a una jerarquía de clases sin modificar sus definiciones existentes.",
    hint: "Externo a la jerarquía.",
    bonuses: { visitor: 5, strategy: 2 },
  },
  {
    id: "report_over_hierarchy",
    statement: "Recorrer toda la jerarquía de empleados generando distintos reportes (nómina, asistencia, KPIs).",
    hint: "Varias visitas al mismo árbol.",
    bonuses: { visitor: 5, composite: 4, iterator: 2 },
  },
];

export const PROBLEM_IDS: readonly ProblemId[] = PROBLEMS.map((p) => p.id);

export function findProblem(id: string): ProblemSpec | null {
  return PROBLEMS.find((p) => p.id === id) ?? null;
}

/**
 * Devuelve el patrón con MAYOR afinidad para un problema — la "respuesta
 * canónica" didáctica. Útil para feedback post-apuesta: "el problema era X,
 * la mejor respuesta era Y". Devuelve null si el problema no tiene bonuses
 * (edge case que no debería pasar en el catálogo actual).
 */
export function idealPatternForProblem(
  problem: ProblemSpec,
): { pattern: PatternSpec; bonus: number } | null {
  let best: { pattern: PatternSpec; bonus: number } | null = null;
  for (const [patternId, bonus] of Object.entries(problem.bonuses)) {
    if (typeof bonus !== "number") continue;
    const spec = findPattern(patternId);
    if (!spec) continue;
    if (!best || bonus > best.bonus) best = { pattern: spec, bonus };
  }
  return best;
}

/**
 * Niveles de apuesta. Más bajos que la tragamonedas ($100/$200/$500) a
 * propósito: la carrera es una actividad pasiva para quien no tiene mucho
 * tiempo o solo quiere mirar. No debería mover el saldo del jugador demasiado.
 */
export const CARRERA_BET_LEVELS = [50, 100, 200] as const;
export type CarreraBetLevel = (typeof CARRERA_BET_LEVELS)[number];

export function isCarreraBetLevel(value: unknown): value is CarreraBetLevel {
  return (
    typeof value === "number" &&
    (CARRERA_BET_LEVELS as readonly number[]).includes(value)
  );
}

/**
 * Ciclo por casino: cada carrera dura 2:30 min y entre carreras hay 2:30 min
 * de ventana de apuestas (y resultado). Total por ciclo = 5:00 = 300s.
 *
 * Distribución del ciclo (t en segundos desde inicio de ciclo):
 *   [0, 150)   → BETTING: apuestas abiertas para ESTA carrera. Se muestra el
 *                resultado de la carrera anterior (ciclo-1) al inicio.
 *   [150, 300) → RACING: carrera en curso (2:30 min), apuestas cerradas.
 *
 * La "carrera N" se define como el tramo RACING que inicia en cycleStart+150s
 * y termina en cycleStart+300s. Las apuestas colocadas durante el BETTING del
 * ciclo aplican a la carrera de ESE mismo ciclo.
 */
export const CARRERA_CYCLE_MS = 300_000;
export const CARRERA_BETTING_MS = 150_000;
export const CARRERA_RACING_MS = CARRERA_CYCLE_MS - CARRERA_BETTING_MS;

/** Pista en "pasos" enteros. Más largo = más drama, menos = más ticks visibles. */
export const CARRERA_TRACK_STEPS = 60;

/** Tipo de ganador. Top 3 para mostrar podio y resolver apuestas de ganador/podio. */
export type CarreraPosition = 1 | 2 | 3;

/**
 * Multiplicadores de payout según afinidad del patrón ganador (para apuesta
 * "WIN"). El cap busca un RTP ~85-90% (similar a la tragamonedas). Diseño:
 *
 *   - Favorito fuerte (bonus 5): 1.6x → poca recompensa, pero probable.
 *   - Buen segundo (bonus 3-4): 2.5x → balance.
 *   - Mediocre (bonus 1-2): 4x     → underdog razonable.
 *   - Mismatch puro (bonus 0): 7x   → dark horse.
 *   - Anti-patrón: 10x             → caballo loco, casi nunca gana pero paga.
 *
 * Para apuesta "PODIO" (top 3) los multiplicadores se dividen aproximadamente
 * entre 2 (ver settleBet).
 */
export function winMultiplierForBonus(bonus: number, isAnti: boolean): number {
  if (isAnti) return 10;
  if (bonus >= 5) return 1.6;
  if (bonus >= 3) return 2.5;
  if (bonus >= 1) return 4;
  return 7;
}

export function podiumMultiplierForBonus(bonus: number, isAnti: boolean): number {
  // Podio paga ~40% de lo que pagaría un WIN: mucho más probable que atinar al #1.
  const raw = winMultiplierForBonus(bonus, isAnti) * 0.4;
  // Mínimo 1.2x para que siempre valga la pena contra el riesgo de perder.
  return Math.max(1.2, Math.round(raw * 10) / 10);
}

export type BetKind = "win" | "podium";

export const BET_KINDS: readonly BetKind[] = ["win", "podium"];

export function isBetKind(value: unknown): value is BetKind {
  return typeof value === "string" && (BET_KINDS as readonly string[]).includes(value);
}
