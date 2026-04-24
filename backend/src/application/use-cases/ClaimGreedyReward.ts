import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import {
  creditPlayerCore,
  validateBatchId,
  type CreditPlayerOutcome,
} from "./helpers/creditPlayerCore.js";
import { annotateNoteWithEvents } from "./helpers/applyCasinoEventMultiplier.js";

export type ClaimGreedyRewardInput = {
  casinoId: string;
  actorId: string;
  batchId: string;
};

export type ClaimGreedyRewardResult = {
  batchId: string;
  /** Saldo del jugador tras el crédito (o el último conocido si el crédito fue skipped). */
  balance: number;
  outcome: CreditPlayerOutcome;
};

/** Premio fijo del clicker Greedy: 1 unidad por cada 10 toques acumulados en cliente. */
const GREEDY_REWARD_AMOUNT = 1;

/**
 * Mini-clicker "Greedy": el jugador acumula 10 toques locales en la imagen del
 * banner arriba del saldo y acá se cobra +1 al wallet. Idempotente por
 * `batchId` — si el cliente reintenta tras red caída, sólo se acredita una vez.
 *
 * Se salta la validación global `validateAmount` (multiplos de 100) porque el
 * monto está hardcodeado y el flujo es de juego, no de cajero. El flujo es
 * equivalente en seguridad al slot_payout: server-side amount, trusted by the
 * use case, idempotent by batchId.
 */
export class ClaimGreedyRewardUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
    private readonly casinoEvents: CasinoEventRepo,
  ) {}

  async execute(input: ClaimGreedyRewardInput): Promise<ClaimGreedyRewardResult> {
    if (!input.actorId) throw AuthError.tokenInvalid();

    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.active) throw AuthError.casinoArchived();
    if (casino.subastaActive) throw AuthError.casinoInSubasta();

    const batchErr = validateBatchId(input.batchId);
    if (batchErr) throw AuthError.validation(batchErr);
    const batchId = input.batchId.trim();

    const player = await this.users.findById(input.actorId);
    if (!player) throw AuthError.tokenInvalid();
    if (player.role !== "player") {
      throw AuthError.validation(
        `Greedy es solo para jugadores (rol actual: ${player.role}).`,
      );
    }
    if (!player.active) throw AuthError.inactiveAccount();
    if (
      player.departamento === null ||
      !casino.departamentos.includes(player.departamento)
    ) {
      throw AuthError.validation("player is not part of this casino's roster");
    }

    // Evento GREEDY_DOUBLE: si está activo, duplicamos el reward (2 fichas
    // por cada 100 clicks en vez de 1). No pasa por el helper genérico
    // porque el reward es un literal, no un amount variable.
    const activeEvents = await this.casinoEvents.listActiveByCasino(
      input.casinoId,
    );
    const boost = activeEvents.find(
      (e) => e.active && e.type === "GREEDY_DOUBLE",
    );
    const amount = boost ? GREEDY_REWARD_AMOUNT * 2 : GREEDY_REWARD_AMOUNT;
    const note = annotateNoteWithEvents(
      "greedy clicker reward",
      boost ? [boost.name] : [],
      boost ? 2 : 1,
    );

    const outcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        playerId: input.actorId,
        amount,
        batchId,
        actorId: input.actorId,
        note,
        kind: "greedy_reward",
      },
    );

    let balance: number;
    if (outcome.balance !== null) {
      balance = outcome.balance;
    } else {
      // Falló el increment — devolvemos el último saldo conocido para que la
      // UI refresque sin mostrar un placeholder raro.
      const wallet = await this.wallets.findByCasinoAndPlayer(
        input.casinoId,
        input.actorId,
      );
      balance = wallet?.balance ?? 0;
    }

    return { batchId, balance, outcome };
  }
}
