import type { AppUserRepo } from "../../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../../domain/ports/CasinoRepo.js";
import type { PatternRaceBetRepo } from "../../../domain/ports/PatternRaceBetRepo.js";
import type { WalletRepo } from "../../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../../domain/ports/WalletTransactionRepo.js";
import type { PatternRaceBet } from "../../../domain/entities/PatternRaceBet.js";
import {
  CARRERA_BETTING_MS,
  isBetKind,
  isCarreraBetLevel,
  isPatternId,
  type BetKind,
  type PatternId,
} from "../../../domain/entities/patternRace/patternCatalog.js";
import type { Role } from "../../../domain/entities/Role.js";
import { AuthError } from "../../../domain/errors/AuthError.js";
import {
  creditPlayerCore,
  validateBatchId,
} from "../helpers/creditPlayerCore.js";
import {
  cycleIndexForTime,
  cycleStartMs,
  computeRace,
} from "./computeRace.js";

/** Máximo de apuestas abiertas por jugador en un mismo ciclo. */
const MAX_OPEN_BETS_PER_CYCLE = 3;

export type PlacePatternRaceBetInput = {
  actorId: string;
  actorRole: Role;
  casinoId: string;
  patternId: string;
  betKind: string;
  amount: number;
  betBatchId: string;
};

export type PlacePatternRaceBetResult = {
  bet: PatternRaceBet;
  balanceAfter: number;
  replayed: boolean;
};

/**
 * Coloca una apuesta en la carrera de patrones del ciclo actual del casino.
 * Validaciones:
 *   - Rol = player.
 *   - Casino existe y activo.
 *   - Ventana de apuestas abierta (fase "betting" del ciclo actual).
 *   - patternId corresponde a un concursante real del ciclo actual.
 *   - Saldo suficiente.
 *   - Rate-limit: máx N apuestas abiertas por ciclo por jugador.
 *
 * Idempotencia: betBatchId actúa como idempotencyKey al nivel de apuesta Y al
 * nivel de la WalletTransaction (suffix="bet"). Reintentar con mismo batchId
 * no crea apuesta nueva ni vuelve a debitar.
 */
export class PlacePatternRaceBetUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
    private readonly bets: PatternRaceBetRepo,
  ) {}

  async execute(input: PlacePatternRaceBetInput): Promise<PlacePatternRaceBetResult> {
    if (!input.actorId) throw AuthError.tokenInvalid();
    if (input.actorRole !== "player" && input.actorRole !== "dealer") {
      // Los dealers apuestan contra su saldo de comisiones; masters siguen
      // vetados para evitar que el staff ordenador apueste en sus propias
      // carreras.
      throw AuthError.validation(
        `La carrera de patrones es solo para jugadores y dealers (rol actual: ${input.actorRole}).`,
      );
    }

    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.active) throw AuthError.casinoArchived();
    if (casino.subastaActive) throw AuthError.casinoInSubasta();

    if (!isPatternId(input.patternId)) {
      throw AuthError.validation("patternId invalido");
    }
    if (!isBetKind(input.betKind)) {
      throw AuthError.validation("betKind debe ser 'win' o 'podium'");
    }
    if (!isCarreraBetLevel(input.amount)) {
      throw AuthError.validation("amount debe ser 50, 100 o 200");
    }
    const batchErr = validateBatchId(input.betBatchId);
    if (batchErr) throw AuthError.validation(batchErr);
    const betBatchId = input.betBatchId.trim();

    const player = await this.users.findById(input.actorId);
    if (!player) throw AuthError.tokenInvalid();
    if (player.role !== "player") throw AuthError.insufficientRole();
    if (!player.active) throw AuthError.inactiveAccount();
    if (
      player.departamento === null ||
      !casino.departamentos.includes(player.departamento)
    ) {
      throw AuthError.validation("jugador no pertenece al roster de este casino");
    }

    // Idempotencia: misma apuesta reintento → devolver estado.
    const existing = await this.bets.findByBetBatchId(betBatchId);
    if (existing) {
      const wallet = await this.wallets.findByCasinoAndUser(
        input.casinoId,
        input.actorId,
      );
      return {
        bet: existing,
        balanceAfter: wallet?.balance ?? 0,
        replayed: true,
      };
    }

    // Validar ventana de apuestas.
    const now = Date.now();
    const cycleIndex = cycleIndexForTime(now);
    const cycleT = now - cycleStartMs(cycleIndex);
    if (cycleT >= CARRERA_BETTING_MS) {
      throw AuthError.validation("las apuestas están cerradas: carrera en curso");
    }

    // Validar que el patrón apostado SÍ está corriendo este ciclo.
    const blueprint = computeRace(input.casinoId, cycleIndex);
    const contestant = blueprint.contestants.find(
      (c) => c.patternId === (input.patternId as PatternId),
    );
    if (!contestant) {
      throw AuthError.validation("ese patrón no corre en esta carrera");
    }

    // Rate limit por ciclo.
    const openCount = await this.bets.countOpenForPlayerAndCycle(
      input.casinoId,
      input.actorId,
      cycleIndex,
    );
    if (openCount >= MAX_OPEN_BETS_PER_CYCLE) {
      throw AuthError.validation(
        `solo puedes tener ${MAX_OPEN_BETS_PER_CYCLE} apuestas abiertas por carrera`,
      );
    }

    // Wallet + saldo.
    const wallet =
      (await this.wallets.findByCasinoAndUser(input.casinoId, input.actorId)) ??
      (await this.wallets.createForCasinoAndUser(input.casinoId, input.actorId));
    if (!wallet.active) {
      throw AuthError.validation("wallet is frozen");
    }
    if (wallet.balance < input.amount) {
      throw AuthError.validation("saldo insuficiente");
    }

    // Débito.
    const debit = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        userId: input.actorId,
        amount: -input.amount,
        batchId: betBatchId,
        actorId: input.actorId,
        note: `carrera bet ${input.amount} on ${input.patternId} (${input.betKind}) cycle=${cycleIndex}`,
        kind: "carrera_bet",
        keySuffix: "bet",
      },
    );
    if (debit.status === "failed") {
      throw AuthError.validation(`debit failed: ${debit.reason}`);
    }

    // Registrar la apuesta. El débito ya ocurrió; si el create falla, el admin
    // puede detectar el caso por el WalletTransaction sin apuesta asociada.
    const bet = await this.bets.create({
      casinoId: input.casinoId,
      playerId: input.actorId,
      walletId: wallet.id,
      cycleIndex,
      patternId: input.patternId as PatternId,
      kind: input.betKind as BetKind,
      amount: input.amount,
      betBatchId,
    });

    const balanceAfter =
      debit.status === "credited" || debit.status === "recovered"
        ? debit.balance
        : (
            await this.wallets.findByCasinoAndUser(
              input.casinoId,
              input.actorId,
            )
          )?.balance ?? 0;

    return { bet, balanceAfter, replayed: false };
  }
}
