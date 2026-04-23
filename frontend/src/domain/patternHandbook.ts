/**
 * Extended educational content for each design pattern, separate from the
 * roulette core (designPatterns.ts) because only the handbook/player-facing
 * modal needs it. Keyed by pattern `id`. The zero slot is intentionally
 * excluded — it has no pattern meaning.
 *
 * Each entry contains:
 *   - umlMermaid: a Mermaid classDiagram source (renders client-side)
 *   - useCases:   3–5 real-world scenarios where this pattern shines
 *   - codeJs:     a minimal, runnable-ish JS snippet showing the structure
 *
 * Content is deliberately compact — these are pocket references, not
 * exhaustive guides. Long-form explanations belong elsewhere.
 */

export type PatternHandbookEntry = {
  umlMermaid: string;
  useCases: readonly string[];
  codeJs: string;
};

export const PATTERN_HANDBOOK: Record<string, PatternHandbookEntry> = {
  // ─────────────────────────── CREATIONAL ───────────────────────────
  singleton: {
    umlMermaid: `classDiagram
  class Singleton {
    -instance: Singleton$
    -constructor()
    +getInstance()$ Singleton
    +doWork()
  }
  Singleton --> Singleton : usa`,
    useCases: [
      "Conexión a base de datos compartida en toda la app.",
      "Configuración global (feature flags, env).",
      "Logger central que escribe a un solo archivo.",
      "Cache en memoria accesible desde cualquier módulo.",
    ],
    codeJs: `class Database {
  static #instance = null;
  #connection;

  constructor() {
    if (Database.#instance) return Database.#instance;
    this.#connection = { host: "localhost", open: true };
    Database.#instance = this;
  }

  static getInstance() {
    return new Database();
  }

  query(sql) {
    console.log("SQL:", sql);
  }
}

const a = Database.getInstance();
const b = Database.getInstance();
console.log(a === b); // true`,
  },
  "abstract-factory": {
    umlMermaid: `classDiagram
  class UIFactory {
    <<interface>>
    +createButton() Button
    +createInput() Input
  }
  class DarkFactory
  class LightFactory
  class Button
  class Input
  UIFactory <|.. DarkFactory
  UIFactory <|.. LightFactory
  DarkFactory ..> Button
  DarkFactory ..> Input`,
    useCases: [
      "Temas de UI (dark/light) con componentes coherentes entre sí.",
      "Soporte multiplataforma: widgets de Windows vs macOS.",
      "Conectores a distintas bases de datos (MySQL, Postgres) con misma API.",
      "Skins de juego con familia de assets coordinados.",
    ],
    codeJs: `class DarkButton { render() { return "[■ dark]"; } }
class LightButton { render() { return "[□ light]"; } }

class DarkFactory {
  createButton() { return new DarkButton(); }
}
class LightFactory {
  createButton() { return new LightButton(); }
}

function buildUI(factory) {
  return factory.createButton().render();
}

console.log(buildUI(new DarkFactory()));  // [■ dark]
console.log(buildUI(new LightFactory())); // [□ light]`,
  },
  builder: {
    umlMermaid: `classDiagram
  class PizzaBuilder {
    -pizza: Pizza
    +addDough(t) PizzaBuilder
    +addSauce(s) PizzaBuilder
    +addTopping(t) PizzaBuilder
    +build() Pizza
  }
  class Pizza
  PizzaBuilder ..> Pizza : construye`,
    useCases: [
      "Objetos con muchos parámetros opcionales (evitar constructor gigante).",
      "Queries SQL construidas paso a paso.",
      "HTTP request builders (method chaining).",
      "Serializadores complejos (PDF, XML) con secciones opcionales.",
    ],
    codeJs: `class PizzaBuilder {
  #pizza = { toppings: [] };
  dough(type)    { this.#pizza.dough = type; return this; }
  sauce(type)    { this.#pizza.sauce = type; return this; }
  topping(item)  { this.#pizza.toppings.push(item); return this; }
  build()        { return { ...this.#pizza }; }
}

const pizza = new PizzaBuilder()
  .dough("napoletana")
  .sauce("tomate")
  .topping("queso")
  .topping("albahaca")
  .build();`,
  },
  "factory-method": {
    umlMermaid: `classDiagram
  class Creator {
    <<abstract>>
    +factoryMethod() Product*
    +operation()
  }
  class ConcreteCreator
  class Product {
    <<interface>>
  }
  class ConcreteProduct
  Creator <|-- ConcreteCreator
  Product <|.. ConcreteProduct
  Creator ..> Product
  ConcreteCreator ..> ConcreteProduct`,
    useCases: [
      "Framework que deja a subclases decidir qué clase crear (ej. Dialog).",
      "Parsers que eligen formato (JSON vs XML) según input.",
      "Notificaciones con canal variable (email, SMS, push).",
      "Exportadores de documento según extensión.",
    ],
    codeJs: `class Notifier {
  send(msg) {
    const ch = this.createChannel();
    ch.deliver(msg);
  }
  createChannel() { throw new Error("abstract"); }
}

class EmailNotifier extends Notifier {
  createChannel() {
    return { deliver: (m) => console.log("email:", m) };
  }
}
class SmsNotifier extends Notifier {
  createChannel() {
    return { deliver: (m) => console.log("sms:", m) };
  }
}

new EmailNotifier().send("hola");
new SmsNotifier().send("hola");`,
  },
  prototype: {
    umlMermaid: `classDiagram
  class Prototype {
    <<interface>>
    +clone() Prototype
  }
  class ConcreteA
  class ConcreteB
  Prototype <|.. ConcreteA
  Prototype <|.. ConcreteB`,
    useCases: [
      "Copiar objetos complejos evitando re-inicialización costosa.",
      "Editores gráficos: duplicar formas con todos sus atributos.",
      "Plantillas de documento que se clonan y ajustan.",
      "Pre-cargar configuración base y clonarla por instancia.",
    ],
    codeJs: `class Shape {
  constructor(type, color, pos) {
    this.type = type;
    this.color = color;
    this.pos = { ...pos };
  }
  clone() {
    return new Shape(this.type, this.color, this.pos);
  }
}

const original = new Shape("círculo", "rojo", { x: 10, y: 20 });
const copia = original.clone();
copia.color = "azul";

console.log(original.color); // rojo
console.log(copia.color);    // azul`,
  },

  // ─────────────────────────── STRUCTURAL ───────────────────────────
  adapter: {
    umlMermaid: `classDiagram
  class Client
  class Target {
    <<interface>>
    +request()
  }
  class Adapter {
    -adaptee: Adaptee
    +request()
  }
  class Adaptee {
    +specificRequest()
  }
  Client --> Target
  Target <|.. Adapter
  Adapter --> Adaptee`,
    useCases: [
      "Integrar una librería antigua con API moderna sin tocarla.",
      "Unificar múltiples proveedores de pago bajo una sola interfaz.",
      "Conectar clases con interfaces incompatibles (legacy ↔ nuevo).",
      "Envolver APIs externas para aislar cambios futuros.",
    ],
    codeJs: `// Clase legacy con API rara
class OldLogger {
  logText(text) { console.log("[old]", text); }
}

// Interfaz moderna que el resto del código espera
class LoggerAdapter {
  constructor(legacy) { this.legacy = legacy; }
  info(message) { this.legacy.logText(message); }
}

const logger = new LoggerAdapter(new OldLogger());
logger.info("hola"); // [old] hola`,
  },
  bridge: {
    umlMermaid: `classDiagram
  class Abstraction {
    -impl: Implementor
    +operation()
  }
  class RefinedAbstraction
  class Implementor {
    <<interface>>
    +opImpl()
  }
  class ConcreteImplA
  class ConcreteImplB
  Abstraction <|-- RefinedAbstraction
  Implementor <|.. ConcreteImplA
  Implementor <|.. ConcreteImplB
  Abstraction o--> Implementor`,
    useCases: [
      "Cross-platform: una misma API sobre backends distintos.",
      "Remote controls + devices (TV, radio, luces).",
      "Formas geométricas × renderers (SVG, Canvas, WebGL).",
      "Evitar explosión combinatoria de subclases.",
    ],
    codeJs: `// Implementación (bridge "destino")
class SvgRenderer { drawCircle(r) { return \`<svg><circle r=\${r}/></svg>\`; } }
class CanvasRenderer { drawCircle(r) { return \`ctx.arc(0,0,\${r})\`; } }

// Abstracción
class Shape {
  constructor(renderer) { this.renderer = renderer; }
}
class Circle extends Shape {
  constructor(renderer, r) { super(renderer); this.r = r; }
  draw() { return this.renderer.drawCircle(this.r); }
}

new Circle(new SvgRenderer(), 10).draw();
new Circle(new CanvasRenderer(), 10).draw();`,
  },
  composite: {
    umlMermaid: `classDiagram
  class Component {
    <<interface>>
    +operation()
  }
  class Leaf {
    +operation()
  }
  class Composite {
    -children: Component[]
    +add(c)
    +remove(c)
    +operation()
  }
  Component <|.. Leaf
  Component <|.. Composite
  Composite o--> Component`,
    useCases: [
      "Árboles de archivos y carpetas con misma interfaz.",
      "Menús con submenús anidados.",
      "DOM: elementos individuales y contenedores tratados igual.",
      "Organigramas corporativos (empleado ↔ equipo).",
    ],
    codeJs: `class File {
  constructor(name, size) { this.name = name; this.size = size; }
  getSize() { return this.size; }
}

class Folder {
  constructor(name) { this.name = name; this.children = []; }
  add(node) { this.children.push(node); return this; }
  getSize() {
    return this.children.reduce((sum, c) => sum + c.getSize(), 0);
  }
}

const root = new Folder("src")
  .add(new File("index.js", 500))
  .add(new Folder("utils").add(new File("date.js", 200)));
console.log(root.getSize()); // 700`,
  },
  decorator: {
    umlMermaid: `classDiagram
  class Component {
    <<interface>>
    +operation()
  }
  class ConcreteComponent
  class Decorator {
    -wrappee: Component
    +operation()
  }
  class BoldDecorator
  class ItalicDecorator
  Component <|.. ConcreteComponent
  Component <|.. Decorator
  Decorator <|-- BoldDecorator
  Decorator <|-- ItalicDecorator
  Decorator o--> Component`,
    useCases: [
      "Añadir features a streams (compresión, cifrado) sin heredar.",
      "Middlewares HTTP encadenados (auth, logging, CORS).",
      "Decoradores de UI (bordes, sombras) composables.",
      "Envolver objetos con lógica adicional en runtime.",
    ],
    codeJs: `const plain = { render: () => "texto" };

const bold = (c) => ({
  render: () => \`<b>\${c.render()}</b>\`,
});
const italic = (c) => ({
  render: () => \`<i>\${c.render()}</i>\`,
});

const decorated = bold(italic(plain));
console.log(decorated.render());
// <b><i>texto</i></b>`,
  },
  facade: {
    umlMermaid: `classDiagram
  class Facade {
    +doBigTask()
  }
  class SubA {
    +stepA()
  }
  class SubB {
    +stepB()
  }
  class SubC {
    +stepC()
  }
  class Client
  Client --> Facade
  Facade --> SubA
  Facade --> SubB
  Facade --> SubC`,
    useCases: [
      "Simplificar APIs complejas (FFmpeg, AWS SDK).",
      "Unificar varios microservicios detrás de un endpoint.",
      "Capa de compatibilidad para librerías legacy.",
      "Orquestar subsistemas (video + audio + subtítulos).",
    ],
    codeJs: `class AudioSys { play(f) { console.log("audio:", f); } }
class VideoSys { play(f) { console.log("video:", f); } }
class SubsSys  { show(f) { console.log("subs:", f); } }

class MediaFacade {
  #a = new AudioSys();
  #v = new VideoSys();
  #s = new SubsSys();
  playMovie(file) {
    this.#v.play(file);
    this.#a.play(file);
    this.#s.show(file + ".srt");
  }
}

new MediaFacade().playMovie("matrix");`,
  },
  flyweight: {
    umlMermaid: `classDiagram
  class FlyweightFactory {
    -pool: Map
    +get(key) Flyweight
  }
  class Flyweight {
    -intrinsic
    +operation(extrinsic)
  }
  class Client
  Client --> FlyweightFactory
  FlyweightFactory o--> Flyweight`,
    useCases: [
      "Renderizar miles de partículas compartiendo sprite/textura.",
      "Caracteres en editores de texto (font, glyph).",
      "Árboles en un bosque compartiendo modelo 3D.",
      "Cache de strings idénticos en VMs (intern pool).",
    ],
    codeJs: `const textureCache = new Map();
function getTexture(name) {
  if (!textureCache.has(name)) {
    textureCache.set(name, { pixels: \`...\${name}...\` });
  }
  return textureCache.get(name);
}

class Tree {
  constructor(x, y, species) {
    this.x = x; this.y = y;
    this.texture = getTexture(species); // compartido
  }
}

const bosque = Array.from({ length: 10000 }, (_, i) =>
  new Tree(i, i, i % 2 ? "pino" : "roble"),
);
// solo 2 texturas reales en memoria`,
  },
  proxy: {
    umlMermaid: `classDiagram
  class Subject {
    <<interface>>
    +request()
  }
  class RealSubject {
    +request()
  }
  class Proxy {
    -real: RealSubject
    +request()
  }
  Subject <|.. RealSubject
  Subject <|.. Proxy
  Proxy --> RealSubject`,
    useCases: [
      "Lazy loading de imágenes o recursos pesados.",
      "Proxy de acceso (ACL) antes de llegar al recurso.",
      "Proxy remoto (RPC) que esconde la comunicación de red.",
      "Cache de resultados (memoization) transparente.",
    ],
    codeJs: `class ExpensiveImage {
  constructor(url) {
    this.url = url;
    console.log("cargando", url); // pesado
  }
  display() { console.log("render:", this.url); }
}

class ImageProxy {
  constructor(url) { this.url = url; this.real = null; }
  display() {
    if (!this.real) this.real = new ExpensiveImage(this.url);
    this.real.display();
  }
}

const img = new ImageProxy("foto.jpg");
// nada cargado todavía
img.display(); // ahora sí carga y muestra`,
  },

  // ─────────────────────────── BEHAVIORAL ───────────────────────────
  "chain-of-responsibility": {
    umlMermaid: `classDiagram
  class Handler {
    -next: Handler
    +handle(req)
    +setNext(h)
  }
  class AuthHandler
  class RateLimitHandler
  class LogHandler
  Handler <|-- AuthHandler
  Handler <|-- RateLimitHandler
  Handler <|-- LogHandler
  Handler o--> Handler : next`,
    useCases: [
      "Middlewares HTTP (auth → rate-limit → handler).",
      "Validadores encadenados de formulario.",
      "Manejo de eventos UI que burbujean.",
      "Sistemas de soporte: nivel 1 → nivel 2 → supervisor.",
    ],
    codeJs: `class Handler {
  setNext(h) { this.next = h; return h; }
  handle(req) {
    if (this.next) return this.next.handle(req);
  }
}

class Auth extends Handler {
  handle(req) {
    if (!req.user) return "401";
    return super.handle(req);
  }
}
class RateLimit extends Handler {
  handle(req) {
    if (req.count > 100) return "429";
    return super.handle(req);
  }
}

const chain = new Auth();
chain.setNext(new RateLimit());
console.log(chain.handle({ user: "u", count: 5 })); // undefined = OK`,
  },
  command: {
    umlMermaid: `classDiagram
  class Command {
    <<interface>>
    +execute()
    +undo()
  }
  class Invoker {
    -history: Command[]
    +run(c)
  }
  class Receiver
  class ConcreteCommand {
    -receiver
    +execute()
  }
  Command <|.. ConcreteCommand
  ConcreteCommand --> Receiver
  Invoker o--> Command`,
    useCases: [
      "Undo/redo en editores.",
      "Colas de tareas (job queues) con retry.",
      "Macros de teclado o scripts grabados.",
      "Transacciones que pueden deshacerse.",
    ],
    codeJs: `class AddTextCmd {
  constructor(doc, text) { this.doc = doc; this.text = text; }
  execute() { this.doc.content += this.text; }
  undo()    { this.doc.content = this.doc.content.slice(0, -this.text.length); }
}

const doc = { content: "" };
const history = [];

function run(cmd) { cmd.execute(); history.push(cmd); }
function undo()   { history.pop()?.undo(); }

run(new AddTextCmd(doc, "hola "));
run(new AddTextCmd(doc, "mundo"));
undo();
console.log(doc.content); // "hola "`,
  },
  interpreter: {
    umlMermaid: `classDiagram
  class Expression {
    <<interface>>
    +interpret(ctx)
  }
  class NumberExpr
  class AddExpr {
    -left
    -right
  }
  class Context
  Expression <|.. NumberExpr
  Expression <|.. AddExpr
  AddExpr o--> Expression
  Expression ..> Context`,
    useCases: [
      "Mini-lenguajes de consulta (filtros, fórmulas).",
      "Motores de reglas de negocio.",
      "Expresiones regulares / gramáticas pequeñas.",
      "DSLs para configuración dinámica.",
    ],
    codeJs: `class Num {
  constructor(v) { this.v = v; }
  eval() { return this.v; }
}
class Add {
  constructor(l, r) { this.l = l; this.r = r; }
  eval() { return this.l.eval() + this.r.eval(); }
}
class Mul {
  constructor(l, r) { this.l = l; this.r = r; }
  eval() { return this.l.eval() * this.r.eval(); }
}

// 2 + (3 * 4) = 14
const ast = new Add(new Num(2), new Mul(new Num(3), new Num(4)));
console.log(ast.eval());`,
  },
  iterator: {
    umlMermaid: `classDiagram
  class Aggregate {
    <<interface>>
    +createIterator() Iterator
  }
  class Iterator {
    <<interface>>
    +next()
    +hasNext()
  }
  class ConcreteAggregate
  class ConcreteIterator
  Aggregate <|.. ConcreteAggregate
  Iterator <|.. ConcreteIterator
  ConcreteAggregate ..> ConcreteIterator : crea`,
    useCases: [
      "Recorrer colecciones sin exponer estructura (árboles, grafos).",
      "Paginación de resultados en APIs.",
      "Streams infinitos (lazy).",
      "for...of en cualquier iterable custom.",
    ],
    codeJs: `class Range {
  constructor(start, end) { this.start = start; this.end = end; }
  *[Symbol.iterator]() {
    for (let i = this.start; i < this.end; i++) yield i;
  }
}

const r = new Range(1, 4);
for (const n of r) console.log(n); // 1, 2, 3

const doble = [...r].map(n => n * 2);`,
  },
  mediator: {
    umlMermaid: `classDiagram
  class Mediator {
    <<interface>>
    +notify(sender, event)
  }
  class ChatRoom
  class User {
    -mediator
    +send(msg)
    +receive(msg)
  }
  Mediator <|.. ChatRoom
  ChatRoom o--> User
  User --> Mediator`,
    useCases: [
      "Chat rooms (los usuarios no se hablan directo).",
      "Diálogos de UI donde campos se afectan entre sí.",
      "Air-traffic control entre aviones.",
      "Event bus central en apps modulares.",
    ],
    codeJs: `class ChatRoom {
  #users = new Set();
  join(u) { u.room = this; this.#users.add(u); }
  broadcast(from, msg) {
    for (const u of this.#users) {
      if (u !== from) u.receive(from.name, msg);
    }
  }
}

class User {
  constructor(name) { this.name = name; }
  send(msg) { this.room.broadcast(this, msg); }
  receive(from, msg) { console.log(\`\${this.name} <- \${from}: \${msg}\`); }
}

const room = new ChatRoom();
const a = new User("Ana");
const b = new User("Beto");
room.join(a); room.join(b);
a.send("hola");`,
  },
  memento: {
    umlMermaid: `classDiagram
  class Originator {
    -state
    +save() Memento
    +restore(m)
  }
  class Memento {
    -state
    +getState()
  }
  class Caretaker {
    -history: Memento[]
  }
  Originator ..> Memento : crea
  Caretaker o--> Memento`,
    useCases: [
      "Undo profundo en editores complejos.",
      "Snapshots de estado de juego.",
      "Transacciones con rollback.",
      "Time-travel debugging (Redux DevTools).",
    ],
    codeJs: `class Editor {
  #content = "";
  type(t) { this.#content += t; }
  save()   { return { content: this.#content }; }
  restore(m) { this.#content = m.content; }
  get text() { return this.#content; }
}

const ed = new Editor();
ed.type("hola ");
const snap = ed.save();
ed.type("mundo");
console.log(ed.text); // hola mundo
ed.restore(snap);
console.log(ed.text); // hola `,
  },
  observer: {
    umlMermaid: `classDiagram
  class Subject {
    -observers: Observer[]
    +attach(o)
    +detach(o)
    +notify()
  }
  class Observer {
    <<interface>>
    +update(data)
  }
  class ConcreteSubject
  class ConcreteObserver
  Subject <|-- ConcreteSubject
  Observer <|.. ConcreteObserver
  Subject o--> Observer`,
    useCases: [
      "Reactividad en UI (signals, hooks).",
      "Event emitters (DOM, Node.js EventEmitter).",
      "Pub/Sub en apps distribuidas.",
      "Spreadsheet: celdas se recalculan al cambiar dependencias.",
    ],
    codeJs: `class Subject {
  #observers = new Set();
  subscribe(fn) {
    this.#observers.add(fn);
    return () => this.#observers.delete(fn);
  }
  notify(data) {
    for (const fn of this.#observers) fn(data);
  }
}

const temperatura = new Subject();
const off = temperatura.subscribe(t => console.log("UI:", t));
temperatura.subscribe(t => console.log("log:", t));

temperatura.notify(22);
off(); // desuscribe UI`,
  },
  state: {
    umlMermaid: `classDiagram
  class Context {
    -state: State
    +setState(s)
    +request()
  }
  class State {
    <<interface>>
    +handle(ctx)
  }
  class Idle
  class Playing
  class Paused
  Context o--> State
  State <|.. Idle
  State <|.. Playing
  State <|.. Paused`,
    useCases: [
      "Reproductores multimedia (idle/play/pause).",
      "Máquinas de estado en juegos (menu/playing/over).",
      "Flujos de checkout (carrito → pago → confirmación).",
      "Workflows de aprobación (draft → review → published).",
    ],
    codeJs: `class Player {
  constructor() { this.state = "idle"; }
  press() {
    const next = {
      idle: "playing",
      playing: "paused",
      paused: "playing",
    }[this.state];
    console.log(\`\${this.state} -> \${next}\`);
    this.state = next;
  }
}

const p = new Player();
p.press(); // idle -> playing
p.press(); // playing -> paused
p.press(); // paused -> playing`,
  },
  strategy: {
    umlMermaid: `classDiagram
  class Context {
    -strategy: Strategy
    +setStrategy(s)
    +execute()
  }
  class Strategy {
    <<interface>>
    +doIt(data)
  }
  class QuickSort
  class MergeSort
  class BubbleSort
  Context o--> Strategy
  Strategy <|.. QuickSort
  Strategy <|.. MergeSort
  Strategy <|.. BubbleSort`,
    useCases: [
      "Algoritmos de sorting o compresión intercambiables.",
      "Cálculo de precios (regular, descuento, VIP).",
      "Validaciones que cambian según contexto.",
      "Proveedores de pago seleccionados en runtime.",
    ],
    codeJs: `const strategies = {
  regular: (total) => total,
  vip:     (total) => total * 0.8,
  bulk:    (total) => total > 1000 ? total * 0.9 : total,
};

class Pricing {
  constructor(type) { this.apply = strategies[type]; }
}

const p = new Pricing("vip");
console.log(p.apply(100)); // 80`,
  },
  "template-method": {
    umlMermaid: `classDiagram
  class AbstractClass {
    +templateMethod()
    #step1()*
    #step2()*
    #hook()
  }
  class ConcreteA
  class ConcreteB
  AbstractClass <|-- ConcreteA
  AbstractClass <|-- ConcreteB`,
    useCases: [
      "Frameworks que definen esqueleto y delegan pasos (ej. tests).",
      "Report generators con pasos fijos pero datos variables.",
      "Pipelines de build (lint → compile → test → deploy).",
      "Algoritmos con partes que cambian (estrategia parcial).",
    ],
    codeJs: `class Report {
  generate() {          // template method — no sobreescribir
    this.header();
    const data = this.fetchData();
    this.render(data);
    this.footer();
  }
  header()        { console.log("==="); }
  footer()        { console.log("==="); }
  fetchData()     { throw new Error("abstract"); }
  render(data)    { throw new Error("abstract"); }
}

class SalesReport extends Report {
  fetchData()    { return [100, 200, 300]; }
  render(d)      { console.log("ventas:", d.join(",")); }
}

new SalesReport().generate();`,
  },
  visitor: {
    umlMermaid: `classDiagram
  class Visitor {
    <<interface>>
    +visitA(a)
    +visitB(b)
  }
  class Element {
    <<interface>>
    +accept(v)
  }
  class ElementA
  class ElementB
  class PrintVisitor
  Visitor <|.. PrintVisitor
  Element <|.. ElementA
  Element <|.. ElementB
  ElementA ..> Visitor
  ElementB ..> Visitor`,
    useCases: [
      "Recorrer AST y aplicar transformaciones (compiladores).",
      "Calcular métricas sobre estructuras heterogéneas.",
      "Exportar distintas representaciones (JSON, XML) del mismo objeto.",
      "Operaciones que no queremos mezclar con la clase base.",
    ],
    codeJs: `class Circle { constructor(r) { this.r = r; }
  accept(v) { return v.circle(this); } }
class Square { constructor(s) { this.s = s; }
  accept(v) { return v.square(this); } }

const areaVisitor = {
  circle: c => Math.PI * c.r ** 2,
  square: s => s.s ** 2,
};
const nameVisitor = {
  circle: () => "círculo",
  square: () => "cuadrado",
};

const shapes = [new Circle(3), new Square(4)];
shapes.forEach(s => {
  console.log(s.accept(nameVisitor), s.accept(areaVisitor));
});`,
  },
};
