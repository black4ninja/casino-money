import { useMemo, useReducer, useState } from "react";
import { AppLayout } from "@/components/templates/AppLayout";
import { Card } from "@/components/atoms/Card";
import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Input } from "@/components/atoms/Input";
import { Chip } from "@/components/atoms/Chip";
import { deriveKeypairFromPassword } from "@/crypto/keys";
import { bytesToBase64Url, base64UrlToBytes } from "@/crypto/encoding";
import { randomSalt, uuid } from "@/crypto/random";
import { createPlayerAccount, type PlayerAccount } from "@/domain/player";
import {
  issueChip,
  verifyForRedeem,
  sumChips,
  verifyWalletChip,
} from "@/domain/chip";
import { endorseChip, verifyEndorsementSignatures } from "@/domain/endorsement";
import type { Keypair } from "@/crypto/signatures";
import { DENOMINATIONS, type Denomination } from "@/domain/denominations";
import type { Session, WalletChip } from "@/domain/types";
import { composeWelcome, compositionTotal } from "@/domain/composition";

type VirtualPlayer = {
  account: PlayerAccount;
  wallet: WalletChip[];
};
type VirtualDealer = {
  dealerId: string;
  ledger: {
    issued: { serial: string; denom: Denomination; toAlias: string; at: number }[];
    redeemed: {
      serial: string;
      denom: Denomination;
      fromAlias: string;
      at: number;
    }[];
    spentSerials: Set<string>;
  };
};

type LogEntry = {
  id: string;
  at: number;
  tone: "ok" | "warn" | "fail";
  text: string;
};

type State = {
  session: Session | null;
  dealerKeypair: Keypair | null;
  players: VirtualPlayer[];
  dealers: VirtualDealer[];
  log: LogEntry[];
};

type Action =
  | { type: "init-session"; session: Session; keypair: Keypair }
  | { type: "add-player"; player: VirtualPlayer }
  | { type: "add-dealer"; dealer: VirtualDealer }
  | {
      type: "emit";
      dealerIdx: number;
      playerIdx: number;
      chips: WalletChip[];
      total: number;
    }
  | {
      type: "redeem";
      dealerIdx: number;
      playerIdx: number;
      accepted: WalletChip[];
      rejected: { serial: string; reason: string }[];
    }
  | {
      type: "transfer";
      fromIdx: number;
      toIdx: number;
      transferred: WalletChip[];
    }
  | { type: "log"; entry: Omit<LogEntry, "id" | "at"> }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "init-session":
      return {
        ...state,
        session: action.session,
        dealerKeypair: action.keypair,
      };
    case "add-player":
      return { ...state, players: [...state.players, action.player] };
    case "add-dealer":
      return { ...state, dealers: [...state.dealers, action.dealer] };
    case "emit": {
      const players = state.players.map((p, i) =>
        i === action.playerIdx
          ? { ...p, wallet: [...p.wallet, ...action.chips] }
          : p,
      );
      const dealers = state.dealers.map((d, i) => {
        if (i !== action.dealerIdx) return d;
        return {
          ...d,
          ledger: {
            ...d.ledger,
            issued: [
              ...d.ledger.issued,
              ...action.chips.map((wc) => ({
                serial: wc.chip.serial,
                denom: wc.chip.denom,
                toAlias: state.players[action.playerIdx].account.identity.alias,
                at: Date.now(),
              })),
            ],
          },
        };
      });
      return {
        ...state,
        players,
        dealers,
        log: pushLog(
          state.log,
          "ok",
          `${state.dealers[action.dealerIdx].dealerId} → ${state.players[action.playerIdx].account.identity.alias}: +$${action.total}`,
        ),
      };
    }
    case "redeem": {
      const acceptedSerials = new Set(
        action.accepted.map((wc) => wc.chip.serial),
      );
      const players = state.players.map((p, i) =>
        i === action.playerIdx
          ? {
              ...p,
              wallet: p.wallet.filter(
                (wc) => !acceptedSerials.has(wc.chip.serial),
              ),
            }
          : p,
      );
      const dealers = state.dealers.map((d, i) => {
        if (i !== action.dealerIdx) return d;
        const newSpent = new Set(d.ledger.spentSerials);
        action.accepted.forEach((wc) => newSpent.add(wc.chip.serial));
        return {
          ...d,
          ledger: {
            ...d.ledger,
            redeemed: [
              ...d.ledger.redeemed,
              ...action.accepted.map((wc) => ({
                serial: wc.chip.serial,
                denom: wc.chip.denom,
                fromAlias: state.players[action.playerIdx].account.identity.alias,
                at: Date.now(),
              })),
            ],
            spentSerials: newSpent,
          },
        };
      });
      const total = action.accepted.reduce((a, wc) => a + wc.chip.denom, 0);
      let log = state.log;
      if (total > 0) {
        log = pushLog(
          log,
          "ok",
          `${state.players[action.playerIdx].account.identity.alias} → ${state.dealers[action.dealerIdx].dealerId}: -$${total} (${action.accepted.length} fichas cobradas)`,
        );
      }
      for (const r of action.rejected) {
        log = pushLog(
          log,
          "fail",
          `RECHAZADO ${r.serial.slice(0, 8)}: ${r.reason}`,
        );
      }
      return { ...state, players, dealers, log };
    }
    case "transfer": {
      const transferredSerials = new Set(
        action.transferred.map((wc) => wc.chip.serial),
      );
      const players = state.players.map((p, i) => {
        if (i === action.fromIdx) {
          // The transferred wallet chips carry the latest endorsement, so we remove the
          // pre-endorsement originals from the sender.
          return {
            ...p,
            wallet: p.wallet.filter(
              (wc) => !transferredSerials.has(wc.chip.serial),
            ),
          };
        }
        if (i === action.toIdx) {
          return { ...p, wallet: [...p.wallet, ...action.transferred] };
        }
        return p;
      });
      const total = action.transferred.reduce(
        (a, wc) => a + wc.chip.denom,
        0,
      );
      return {
        ...state,
        players,
        log: pushLog(
          state.log,
          "ok",
          `${state.players[action.fromIdx].account.identity.alias} → ${state.players[action.toIdx].account.identity.alias}: $${total} (P2P)`,
        ),
      };
    }
    case "log":
      return { ...state, log: pushLog(state.log, action.entry.tone, action.entry.text) };
    case "reset":
      return {
        session: null,
        dealerKeypair: null,
        players: [],
        dealers: [],
        log: [],
      };
  }
}

function pushLog(
  log: LogEntry[],
  tone: LogEntry["tone"],
  text: string,
): LogEntry[] {
  return [
    { id: uuid(), at: Date.now(), tone, text },
    ...log.slice(0, 199),
  ];
}

export default function Simulator() {
  const [state, dispatch] = useReducer(reducer, {
    session: null,
    dealerKeypair: null,
    players: [],
    dealers: [],
    log: [],
  });

  const [newPlayer, setNewPlayer] = useState("");
  const [newDealer, setNewDealer] = useState("");

  const [initialPerMesa, setInitialPerMesa] = useState(1000);

  async function initSession(perMesa = initialPerMesa) {
    const salt = randomSalt();
    // Use a low iteration count for the simulator — it's a test harness, not a
    // live shared session. All PBKDF2 security relies on the password, not iteration count.
    const kp = deriveKeypairFromPassword("simulator-password", salt, 1000);
    const session: Session = {
      sessionId: uuid(),
      dealerPubKey: bytesToBase64Url(kp.publicKey),
      salt,
      label: "Simulador",
      startedAt: Date.now(),
      mesas: ["Mesa-1", "Mesa-2", "Mesa-3"],
      initialPerMesa: perMesa,
    };
    dispatch({ type: "init-session", session, keypair: kp });
    dispatch({
      type: "log",
      entry: { tone: "ok", text: `Sesión creada · $${perMesa}/mesa` },
    });
  }

  function quickSeed(opts: { withWelcome: boolean }) {
    initSession();
    // Seed three players + three dealers so the user can play immediately.
    window.setTimeout(() => {
      ["Ana", "Beto", "Carla"].forEach((alias) =>
        dispatch({
          type: "add-player",
          player: { account: createPlayerAccount(alias), wallet: [] },
        }),
      );
      ["Mesa-1", "Mesa-2", "Mesa-3"].forEach((dealerId) =>
        dispatch({
          type: "add-dealer",
          dealer: {
            dealerId,
            ledger: {
              issued: [],
              redeemed: [],
              spentSerials: new Set(),
            },
          },
        }),
      );
      if (opts.withWelcome) {
        window.setTimeout(() => grantWelcomeToAll(), 30);
      }
    }, 30);
  }

  /**
   * Source-of-truth decision for the simulator: iterate the dealers that actually
   * exist, not session.mesas. In production (AdminRoster/Caja), session.mesas is
   * authoritative because dealers log in with those exact names. Here we let the
   * user add dealers with any name on the fly, and chips bound to a mesa are only
   * useful if a dealer with that name can redeem them.
   *
   * We also surface any mismatch vs the declared mesas so the tester doesn't get
   * silent discrepancies.
   */
  function issueWelcomeChipsFor(playerIdx: number): {
    granted: number;
    mesas: string[];
  } {
    const perMesa = state.session!.initialPerMesa ?? 1000;
    const composition = composeWelcome(perMesa);
    const perMesaAmount = compositionTotal(composition);
    const player = state.players[playerIdx];
    let granted = 0;
    const touched: string[] = [];
    for (let dIdx = 0; dIdx < state.dealers.length; dIdx++) {
      const dealer = state.dealers[dIdx];
      const chips: WalletChip[] = [];
      for (const d of DENOMINATIONS) {
        for (let i = 0; i < composition[d]; i++) {
          chips.push({
            chip: issueChip({
              denom: d,
              sessionId: state.session!.sessionId,
              dealerId: dealer.dealerId,
              issuedTo: player.account.identity.playerId,
              dealerSecretKey: state.dealerKeypair!.secretKey,
            }),
            endorsements: [],
          });
        }
      }
      if (chips.length > 0) {
        dispatch({
          type: "emit",
          dealerIdx: dIdx,
          playerIdx,
          chips,
          total: perMesaAmount,
        });
        granted += perMesaAmount;
        touched.push(dealer.dealerId);
      }
    }
    return { granted, mesas: touched };
  }

  function logDiscrepancies() {
    const declared = state.session!.mesas ?? [];
    const actual = state.dealers.map((d) => d.dealerId);
    const missing = declared.filter((m) => !actual.includes(m));
    const extras = actual.filter((m) => !declared.includes(m));
    if (missing.length === 0 && extras.length === 0) return;
    const parts: string[] = [];
    if (missing.length)
      parts.push(`declaradas sin dealer activo: ${missing.join(", ")}`);
    if (extras.length)
      parts.push(`dealers ad-hoc fuera de la declaración: ${extras.join(", ")}`);
    dispatch({
      type: "log",
      entry: {
        tone: "warn",
        text: "Caja usa dealers activos · " + parts.join(" · "),
      },
    });
  }

  function grantWelcomeToAll() {
    if (!state.dealerKeypair || !state.session) return;
    if (state.dealers.length === 0) {
      dispatch({
        type: "log",
        entry: { tone: "fail", text: "Sin dealers activos — agrega al menos una mesa" },
      });
      return;
    }
    if (state.players.length === 0) {
      dispatch({
        type: "log",
        entry: { tone: "fail", text: "Sin jugadores — agrega al menos uno" },
      });
      return;
    }
    logDiscrepancies();
    let totalGranted = 0;
    let mesasTouched: string[] = [];
    for (let pIdx = 0; pIdx < state.players.length; pIdx++) {
      const result = issueWelcomeChipsFor(pIdx);
      totalGranted += result.granted;
      mesasTouched = result.mesas;
    }
    dispatch({
      type: "log",
      entry: {
        tone: "ok",
        text: `Caja: $${(totalGranted / state.players.length).toLocaleString("es-MX")} × ${state.players.length} jugadores en ${mesasTouched.length} mesa(s): ${mesasTouched.join(", ")}`,
      },
    });
  }

  function grantWelcomeTo(playerIdx: number) {
    if (!state.dealerKeypair || !state.session) return;
    if (state.dealers.length === 0) {
      dispatch({
        type: "log",
        entry: { tone: "fail", text: "Sin dealers activos — agrega al menos una mesa" },
      });
      return;
    }
    logDiscrepancies();
    const result = issueWelcomeChipsFor(playerIdx);
    if (result.granted === 0) {
      dispatch({
        type: "log",
        entry: { tone: "fail", text: "No se emitieron fichas — revisa las mesas" },
      });
      return;
    }
    const alias = state.players[playerIdx].account.identity.alias;
    dispatch({
      type: "log",
      entry: {
        tone: "ok",
        text: `Caja → ${alias}: $${result.granted.toLocaleString("es-MX")} en ${result.mesas.length} mesa(s)`,
      },
    });
  }

  return (
    <AppLayout
      title="Simulador"
      subtitle="Prueba todos los flujos sin cámara ni QR"
      back={{ to: "/", label: "Inicio" }}
      right={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: "reset" })}
        >
          Reset
        </Button>
      }
    >
      {!state.session ? (
        <Card className="flex flex-col gap-4">
          <p className="text-sm text-[--color-cream]/80">
            Inicia el simulador con un clic. Se crea una sesión en memoria con
            3 jugadores, 3 mesas, y opcionalmente su saldo inicial ya repartido.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-label text-xs text-[--color-cream]/70">
              SALDO INICIAL POR MESA
            </span>
            <input
              type="number"
              value={initialPerMesa}
              onChange={(e) => setInitialPerMesa(Math.max(0, Number(e.target.value) || 0))}
              className="rounded-xl border border-[--color-gold-500]/40 bg-[--color-smoke-800]/60 px-4 py-2 text-[--color-ivory]"
            />
            <span className="text-xs text-[--color-cream]/50">
              × 3 mesas = ${(initialPerMesa * 3).toLocaleString("es-MX")} por jugador
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button variant="gold" onClick={() => quickSeed({ withWelcome: true })}>
              Seed + saldos iniciales
            </Button>
            <Button variant="felt" onClick={() => quickSeed({ withWelcome: false })}>
              Seed sin saldo (caja vacía)
            </Button>
            <Button variant="ghost" onClick={() => initSession()}>
              Sesión vacía
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Card className="flex items-center justify-between gap-3">
            <div>
              <Badge tone="gold">SESIÓN ACTIVA</Badge>
              <p className="mt-1 font-mono text-xs text-[--color-cream]/60">
                {state.session.sessionId.slice(0, 12)}
              </p>
              {state.session.initialPerMesa && (
                <p className="mt-0.5 text-xs text-[--color-cream]/60">
                  Saldo inicial: $
                  {state.session.initialPerMesa.toLocaleString("es-MX")}/mesa ·
                  Total/jugador: $
                  {(
                    state.session.initialPerMesa *
                    (state.session.mesas?.length ?? state.dealers.length ?? 1)
                  ).toLocaleString("es-MX")}
                </p>
              )}
            </div>
            <div className="text-right text-sm">
              <p className="font-display text-2xl text-[--color-gold-300]">
                {state.players.length}J · {state.dealers.length}M
              </p>
              <p className="text-xs text-[--color-cream]/60">
                {state.log.length} eventos
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-3 border-[--color-gold-500]/70">
            <div className="flex items-center justify-between">
              <div>
                <Badge tone="gold">CAJA DEL MAESTRO</Badge>
                <p className="mt-1 text-xs text-[--color-cream]/70">
                  Entrega saldo inicial a jugadores existentes.
                </p>
              </div>
              <Button
                variant="gold"
                size="sm"
                onClick={grantWelcomeToAll}
                disabled={state.players.length === 0 || state.dealers.length === 0}
              >
                Otorgar a todos
              </Button>
            </div>
            {state.players.length > 0 && state.dealers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.players.map((p, i) => {
                  const balance = sumChips(p.wallet);
                  return (
                    <button
                      key={p.account.identity.playerId}
                      onClick={() => grantWelcomeTo(i)}
                      className="flex items-center gap-2 rounded-full border border-[--color-cream]/20 bg-[--color-smoke-800]/60 px-3 py-1 text-xs hover:border-[--color-gold-400]"
                    >
                      <span>{p.account.identity.alias}</span>
                      <span
                        className={
                          balance === 0
                            ? "text-[--color-carmine-400]"
                            : "text-[--color-gold-300]"
                        }
                      >
                        ${balance}
                      </span>
                      <span className="text-[--color-cream]/40">+</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card tone="night" className="flex flex-col gap-3">
            <h3 className="font-label text-sm text-[--color-cream]/80">
              AGREGAR PARTICIPANTES
            </h3>
            <div className="flex gap-2">
              <Input
                value={newPlayer}
                onChange={(e) => setNewPlayer(e.target.value)}
                placeholder="Nombre jugador"
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (newPlayer.trim()) {
                    dispatch({
                      type: "add-player",
                      player: {
                        account: createPlayerAccount(newPlayer.trim()),
                        wallet: [],
                      },
                    });
                    setNewPlayer("");
                  }
                }}
              >
                +Jugador
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                value={newDealer}
                onChange={(e) => setNewDealer(e.target.value)}
                placeholder="Nombre mesa"
                className="flex-1"
              />
              <Button
                variant="gold"
                onClick={() => {
                  if (newDealer.trim()) {
                    dispatch({
                      type: "add-dealer",
                      dealer: {
                        dealerId: newDealer.trim(),
                        ledger: {
                          issued: [],
                          redeemed: [],
                          spentSerials: new Set(),
                        },
                      },
                    });
                    setNewDealer("");
                  }
                }}
              >
                +Mesa
              </Button>
            </div>
          </Card>

          {state.dealers.map((dealer, dIdx) => (
            <DealerPanel
              key={dealer.dealerId}
              state={state}
              dealer={dealer}
              dealerIdx={dIdx}
              dispatch={dispatch}
            />
          ))}

          {state.players.map((player, pIdx) => (
            <PlayerPanel
              key={player.account.identity.playerId}
              state={state}
              player={player}
              playerIdx={pIdx}
              dispatch={dispatch}
            />
          ))}

          <Card tone="night" className="flex flex-col gap-2">
            <h3 className="font-label text-sm text-[--color-cream]/80">
              BITÁCORA ({state.log.length})
            </h3>
            <ul className="max-h-80 overflow-y-auto text-xs">
              {state.log.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-2 border-t border-[--color-gold-500]/10 py-1.5 first:border-t-0"
                >
                  <span
                    className={
                      e.tone === "ok"
                        ? "text-[--color-gold-300]"
                        : e.tone === "warn"
                          ? "text-[--color-cream]/70"
                          : "text-[--color-carmine-400]"
                    }
                  >
                    {e.tone === "ok" ? "✓" : e.tone === "warn" ? "!" : "✗"}
                  </span>
                  <span className="font-mono text-[10px] text-[--color-cream]/50">
                    {new Date(e.at).toLocaleTimeString("es-MX", {
                      hour12: false,
                    })}
                  </span>
                  <span className="flex-1">{e.text}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </AppLayout>
  );
}

function DealerPanel({
  state,
  dealer,
  dealerIdx,
  dispatch,
}: {
  state: State;
  dealer: VirtualDealer;
  dealerIdx: number;
  dispatch: React.Dispatch<Action>;
}) {
  const [targetPlayer, setTargetPlayer] = useState<number>(0);
  const [counts, setCounts] = useState<Record<Denomination, number>>({
    10: 0,
    50: 0,
    100: 0,
    500: 0,
    1000: 0,
  });
  const [expanded, setExpanded] = useState(false);

  const total = DENOMINATIONS.reduce((a, d) => a + counts[d] * d, 0);
  const nChips = DENOMINATIONS.reduce((a, d) => a + counts[d], 0);
  const issuedAmount = dealer.ledger.issued.reduce((a, r) => a + r.denom, 0);
  const redeemedAmount = dealer.ledger.redeemed.reduce(
    (a, r) => a + r.denom,
    0,
  );

  function emit() {
    if (!state.session || !state.dealerKeypair || state.players.length === 0) return;
    const target = state.players[targetPlayer];
    if (!target) return;
    const chips: WalletChip[] = [];
    for (const d of DENOMINATIONS) {
      for (let i = 0; i < counts[d]; i++) {
        const chip = issueChip({
          denom: d,
          sessionId: state.session.sessionId,
          dealerId: dealer.dealerId,
          issuedTo: target.account.identity.playerId,
          dealerSecretKey: state.dealerKeypair.secretKey,
        });
        chips.push({ chip, endorsements: [] });
      }
    }
    if (chips.length === 0) return;
    dispatch({
      type: "emit",
      dealerIdx,
      playerIdx: targetPlayer,
      chips,
      total,
    });
    setCounts({ 10: 0, 50: 0, 100: 0, 500: 0, 1000: 0 });
  }

  return (
    <Card className="flex flex-col gap-3 border-[--color-gold-500]/60">
      <div className="flex items-center justify-between">
        <div>
          <Badge tone="gold">MESA</Badge>
          <h3 className="mt-1 font-display text-xl text-[--color-ivory]">
            {dealer.dealerId}
          </h3>
        </div>
        <div className="text-right text-xs">
          <p className="font-display text-lg text-[--color-gold-300]">
            ${issuedAmount - redeemedAmount}
          </p>
          <p className="text-[--color-cream]/60">
            OUT ${issuedAmount} · IN ${redeemedAmount}
          </p>
        </div>
      </div>

      {state.players.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <span className="font-label text-xs text-[--color-cream]/70">
              EMITIR A
            </span>
            <select
              value={targetPlayer}
              onChange={(e) => setTargetPlayer(Number(e.target.value))}
              className="flex-1 rounded-lg border border-[--color-gold-500]/40 bg-[--color-smoke-800]/60 px-2 py-1 text-sm text-[--color-ivory]"
            >
              {state.players.map((p, i) => (
                <option key={p.account.identity.playerId} value={i}>
                  {p.account.identity.alias}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {DENOMINATIONS.map((d) => (
              <div key={d} className="flex flex-col items-center gap-1">
                <Chip denom={d} size={44} />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setCounts((p) => ({ ...p, [d]: Math.max(0, p[d] - 1) }))
                    }
                    className="h-6 w-6 rounded-full bg-[--color-smoke-700] text-[--color-cream]"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-mono text-sm">
                    {counts[d]}
                  </span>
                  <button
                    onClick={() =>
                      setCounts((p) => ({ ...p, [d]: p[d] + 1 }))
                    }
                    className="h-6 w-6 rounded-full bg-[--color-gold-500] text-[--color-smoke]"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="gold"
            onClick={emit}
            disabled={nChips === 0}
            block
          >
            Firmar y entregar ${total}
          </Button>
        </>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="font-label text-xs text-[--color-cream]/70 hover:text-[--color-gold-300]"
      >
        {expanded ? "▼ ocultar ledger" : "▶ ver ledger"}
      </button>
      {expanded && (
        <div className="max-h-48 overflow-y-auto rounded-lg bg-[--color-smoke-800]/60 p-2 text-xs font-mono">
          {[...dealer.ledger.issued, ...dealer.ledger.redeemed].length === 0 ? (
            <p className="text-[--color-cream]/50">Sin movimientos</p>
          ) : (
            <>
              {dealer.ledger.issued.map((r) => (
                <div key={r.serial + "i"} className="flex justify-between">
                  <span>→ {r.toAlias}</span>
                  <span className="text-[--color-gold-300]">+${r.denom}</span>
                </div>
              ))}
              {dealer.ledger.redeemed.map((r) => (
                <div key={r.serial + "r"} className="flex justify-between">
                  <span>← {r.fromAlias}</span>
                  <span className="text-[--color-ivory]">-${r.denom}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function PlayerPanel({
  state,
  player,
  playerIdx,
  dispatch,
}: {
  state: State;
  player: VirtualPlayer;
  playerIdx: number;
  dispatch: React.Dispatch<Action>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [payDealer, setPayDealer] = useState<number>(0);
  const [paySelection, setPaySelection] = useState<Set<string>>(new Set());
  const [xferTarget, setXferTarget] = useState<number>(
    state.players.length > 1 ? (playerIdx === 0 ? 1 : 0) : 0,
  );
  const [xferSelection, setXferSelection] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"pay" | "transfer">("pay");

  const byDealer = useMemo(() => {
    const map: Record<string, WalletChip[]> = {};
    for (const wc of player.wallet) {
      (map[wc.chip.dealerId] ??= []).push(wc);
    }
    return map;
  }, [player.wallet]);

  const balance = sumChips(player.wallet);
  const dealerPubKey = state.session
    ? base64UrlToBytes(state.session.dealerPubKey)
    : null;

  function redeem() {
    if (!state.session || !dealerPubKey) return;
    const dealer = state.dealers[payDealer];
    if (!dealer) return;
    const selected = player.wallet.filter((wc) =>
      paySelection.has(wc.chip.serial),
    );
    if (selected.length === 0) return;
    const accepted: WalletChip[] = [];
    const rejected: { serial: string; reason: string }[] = [];
    for (const wc of selected) {
      const v = verifyForRedeem(wc, {
        dealerPubKey,
        sessionId: state.session.sessionId,
        myDealerId: dealer.dealerId,
      });
      if (!v.ok) {
        rejected.push({ serial: wc.chip.serial, reason: v.reason });
        continue;
      }
      if (dealer.ledger.spentSerials.has(wc.chip.serial)) {
        rejected.push({ serial: wc.chip.serial, reason: "already-spent" });
        continue;
      }
      accepted.push(wc);
    }
    dispatch({
      type: "redeem",
      dealerIdx: payDealer,
      playerIdx,
      accepted,
      rejected,
    });
    setPaySelection(new Set());
  }

  function transfer() {
    if (!state.session || !dealerPubKey) return;
    const target = state.players[xferTarget];
    if (!target || target.account.identity.playerId === player.account.identity.playerId) return;
    const selected = player.wallet.filter((wc) =>
      xferSelection.has(wc.chip.serial),
    );
    if (selected.length === 0) return;
    const secretKey = base64UrlToBytes(player.account.secretKey);
    const endorsed = selected.map((wc) =>
      endorseChip({
        wc,
        from: player.account.identity.playerId,
        to: target.account.identity.playerId,
        fromSecretKey: secretKey,
      }),
    );
    // Verify the recipient can actually hold these chips (sanity check).
    const pubMap: Record<string, Uint8Array> = {};
    pubMap[player.account.identity.playerId] = base64UrlToBytes(
      player.account.identity.pubKey,
    );
    for (const wc of endorsed) {
      const basic = verifyWalletChip(wc, {
        dealerPubKey,
        sessionId: state.session.sessionId,
        expectedOwner: target.account.identity.playerId,
      });
      const sigs = verifyEndorsementSignatures(wc, pubMap);
      if (!basic.ok || !sigs.ok) {
        dispatch({
          type: "log",
          entry: {
            tone: "fail",
            text: `Transferencia fallida ${wc.chip.serial.slice(0, 8)}: ${basic.ok ? sigs.ok ? "?" : sigs.reason : basic.reason}`,
          },
        });
        return;
      }
    }
    dispatch({
      type: "transfer",
      fromIdx: playerIdx,
      toIdx: xferTarget,
      transferred: endorsed,
    });
    setXferSelection(new Set());
  }

  function toggleSelection(
    serial: string,
    set: Set<string>,
    setter: (s: Set<string>) => void,
  ) {
    const next = new Set(set);
    if (next.has(serial)) next.delete(serial);
    else next.add(serial);
    setter(next);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <Badge tone="felt">JUGADOR</Badge>
          <h3 className="mt-1 font-display text-xl text-[--color-ivory]">
            {player.account.identity.alias}
          </h3>
          <p className="font-mono text-[10px] text-[--color-cream]/50">
            {player.account.identity.playerId}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl text-[--color-gold-300]">
            ${balance}
          </p>
          <p className="text-[10px] text-[--color-cream]/60">
            {player.wallet.length} fichas
          </p>
        </div>
      </div>

      {player.wallet.length > 0 && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("pay")}
              className={[
                "flex-1 rounded-full px-3 py-1 font-label text-xs tracking-widest",
                mode === "pay"
                  ? "bg-[--color-gold-500]/20 text-[--color-gold-300]"
                  : "bg-transparent text-[--color-cream]/50",
              ].join(" ")}
            >
              Pagar a mesa
            </button>
            <button
              onClick={() => setMode("transfer")}
              disabled={state.players.length < 2}
              className={[
                "flex-1 rounded-full px-3 py-1 font-label text-xs tracking-widest disabled:opacity-40",
                mode === "transfer"
                  ? "bg-[--color-gold-500]/20 text-[--color-gold-300]"
                  : "bg-transparent text-[--color-cream]/50",
              ].join(" ")}
            >
              Transferir a jugador
            </button>
          </div>

          {mode === "pay" && (
            <>
              <select
                value={payDealer}
                onChange={(e) => setPayDealer(Number(e.target.value))}
                className="rounded-lg border border-[--color-gold-500]/40 bg-[--color-smoke-800]/60 px-2 py-1 text-sm text-[--color-ivory]"
              >
                {state.dealers.map((d, i) => (
                  <option key={d.dealerId} value={i}>
                    {d.dealerId}
                  </option>
                ))}
              </select>
              <ChipPicker
                wallet={player.wallet}
                selection={paySelection}
                onToggle={(s) => toggleSelection(s, paySelection, setPaySelection)}
                highlightDealer={state.dealers[payDealer]?.dealerId}
              />
              <Button
                variant="gold"
                block
                onClick={redeem}
                disabled={paySelection.size === 0}
              >
                Pagar $
                {player.wallet
                  .filter((wc) => paySelection.has(wc.chip.serial))
                  .reduce((a, wc) => a + wc.chip.denom, 0)}
                {" "}a {state.dealers[payDealer]?.dealerId ?? ""}
              </Button>
            </>
          )}

          {mode === "transfer" && state.players.length > 1 && (
            <>
              <select
                value={xferTarget}
                onChange={(e) => setXferTarget(Number(e.target.value))}
                className="rounded-lg border border-[--color-gold-500]/40 bg-[--color-smoke-800]/60 px-2 py-1 text-sm text-[--color-ivory]"
              >
                {state.players.map((p, i) => (
                  <option
                    key={p.account.identity.playerId}
                    value={i}
                    disabled={i === playerIdx}
                  >
                    {p.account.identity.alias}
                  </option>
                ))}
              </select>
              <ChipPicker
                wallet={player.wallet}
                selection={xferSelection}
                onToggle={(s) =>
                  toggleSelection(s, xferSelection, setXferSelection)
                }
              />
              <Button
                variant="felt"
                block
                onClick={transfer}
                disabled={xferSelection.size === 0}
              >
                Transferir $
                {player.wallet
                  .filter((wc) => xferSelection.has(wc.chip.serial))
                  .reduce((a, wc) => a + wc.chip.denom, 0)}
                {" "}a {state.players[xferTarget]?.account.identity.alias ?? ""}
              </Button>
            </>
          )}
        </>
      )}

      <button
        onClick={() => setExpanded((v) => !v)}
        className="font-label text-xs text-[--color-cream]/70 hover:text-[--color-gold-300]"
      >
        {expanded ? "▼ ocultar fichas" : "▶ ver fichas por mesa"}
      </button>
      {expanded && (
        <div className="space-y-2 text-xs">
          {Object.keys(byDealer).length === 0 ? (
            <p className="text-[--color-cream]/50">Sin fichas</p>
          ) : (
            Object.entries(byDealer).map(([did, chips]) => (
              <div
                key={did}
                className="rounded-lg bg-[--color-smoke-800]/60 p-2"
              >
                <p className="font-label text-xs text-[--color-cream]/60">
                  {did} · ${sumChips(chips)}
                </p>
                <p className="font-mono text-xs">
                  {chips
                    .map((wc) => `$${wc.chip.denom}`)
                    .join(" · ")}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  );
}

function ChipPicker({
  wallet,
  selection,
  onToggle,
  highlightDealer,
}: {
  wallet: WalletChip[];
  selection: Set<string>;
  onToggle: (serial: string) => void;
  highlightDealer?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {wallet.map((wc) => {
        const isSelected = selection.has(wc.chip.serial);
        const dim =
          highlightDealer !== undefined && wc.chip.dealerId !== highlightDealer;
        return (
          <button
            key={wc.chip.serial}
            onClick={() => onToggle(wc.chip.serial)}
            title={`${wc.chip.dealerId} · ${wc.chip.serial.slice(0, 8)}`}
            className={[
              "rounded-full border px-2 py-1 font-mono text-[10px] transition",
              isSelected
                ? "border-[--color-gold-400] bg-[--color-gold-500]/30 text-[--color-gold-300]"
                : "border-[--color-cream]/20 text-[--color-cream]/70",
              dim ? "opacity-30" : "",
            ].join(" ")}
          >
            ${wc.chip.denom}
            <span className="ml-1 opacity-60">{wc.chip.dealerId}</span>
          </button>
        );
      })}
    </div>
  );
}
