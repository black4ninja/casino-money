import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import {
  creditPlayerCore,
  validateBatchId,
  type CreditPlayerOutcome,
} from "./helpers/creditPlayerCore.js";

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

    const outcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        playerId: input.actorId,
        amount: GREEDY_REWARD_AMOUNT,
        batchId,
        actorId: input.actorId,
        note: "greedy clicker reward",
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
