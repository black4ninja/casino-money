import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { CasinoEventRepo } from "../../domain/ports/CasinoEventRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import type { SlotMachineSpinRepo } from "../../domain/ports/SlotMachineSpinRepo.js";
import type { SlotMachineSpin } from "../../domain/entities/SlotMachineSpin.js";
import type { Role } from "../../domain/entities/Role.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import { creditPlayerCore, validateBatchId } from "./helpers/creditPlayerCore.js";
import {
  applyCasinoEventMultiplier,
  annotateNoteWithEvents,
} from "./helpers/applyCasinoEventMultiplier.js";
import { evaluateSlotSpin } from "./slots/evaluateSlotSpin.js";
import { rollSlotReels } from "./slots/rollSlotReels.js";
import { isBetLevel, type SlotOutcome } from "./slots/slotConfig.js";

export type PlaySlotMachineSpinInput = {
  actorId: string;
  actorRole: Role;
  casinoId: string;
  bet: number;
  batchId: string;
};

export type PlaySlotMachineSpinResult = {
  spin: SlotMachineSpin;
  balanceAfter: number;
  outcome: SlotOutcome;
  /** `true` cuando el caller reenvió el mismo batchId y devolvimos el spin previo sin re-rodar. */
  replayed: boolean;
};

/**
 * Juega una tirada de la tragamonedas. Flujo:
 *
 *   1. Validar actor/casino/bet/batchId.
 *   2. Buscar o crear wallet del jugador en el casino (lazy).
 *   3. Idempotencia: si ya existe un SlotMachineSpin con este batchId,
 *      devolverlo sin rodar ni mover saldos. Cubre reintentos después de
 *      una respuesta perdida.
 *   4. Validar saldo suficiente para la apuesta.
 *   5. Débito: creditPlayerCore con delta = -bet, kind="slot_bet",
 *      keySuffix="bet". Si falla, se aborta el spin (no se rueda).
 *   6. RNG en servidor: rollSlotReels genera los 3 símbolos.
 *   7. Evaluar payout table: evaluateSlotSpin devuelve multiplier.
 *   8. Crédito de payout si multiplier > 0: creditPlayerCore con
 *      delta = bet*multiplier, kind="slot_payout", keySuffix="payout".
 *      Si falla, se registra el spin con payout real (0) y se loggea — el
 *      jugador "perdió" (el bet ya se descontó).
 *   9. Persistir el registro histórico SlotMachineSpin.
 *
 * Seguridad de RNG: el RNG vive SOLO en el servidor (crypto.randomInt). El
 * cliente no puede adivinar ni manipular el resultado — solo lo anima.
 */
export class PlaySlotMachineSpinUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
    private readonly spins: SlotMachineSpinRepo,
    private readonly casinoEvents: CasinoEventRepo,
  ) {}

  async execute(input: PlaySlotMachineSpinInput): Promise<PlaySlotMachineSpinResult> {
    // 1. Validaciones básicas.
    if (!input.actorId) throw AuthError.tokenInvalid();
    if (input.actorRole !== "player") {
      // La tragamonedas es personal del jugador. Master/dealer no debería
      // poder apostar desde su propia cuenta — crea un usuario de prueba
      // con rol "player" para probarla.
      throw AuthError.validation(
        `La tragamonedas es solo para jugadores (rol actual: ${input.actorRole}).`,
      );
    }

    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");
    if (!casino.active) throw AuthError.casinoArchived();
    if (casino.subastaActive) throw AuthError.casinoInSubasta();

    if (!isBetLevel(input.bet)) {
      throw AuthError.validation("bet must be 100, 200 or 500");
    }

    const batchErr = validateBatchId(input.batchId);
    if (batchErr) throw AuthError.validation(batchErr);
    const batchId = input.batchId.trim();

    const player = await this.users.findById(input.actorId);
    if (!player) throw AuthError.tokenInvalid();
    if (player.role !== "player") throw AuthError.insufficientRole();
    if (!player.active) throw AuthError.inactiveAccount();
    if (
      player.departamento === null ||
      !casino.departamentos.includes(player.departamento)
    ) {
      throw AuthError.validation("player is not part of this casino's roster");
    }

    // 2. Idempotencia — si ya existe un spin con este batchId, devolver el
    //    estado persistido sin mover saldos.
    const existing = await this.spins.findByBatchId(batchId);
    if (existing) {
      const wallet = await this.wallets.findByCasinoAndPlayer(
        input.casinoId,
        input.actorId,
      );
      const balanceAfter = wallet?.balance ?? 0;
      const { outcome } = evaluateSlotSpin(existing.result);
      return { spin: existing, balanceAfter, outcome, replayed: true };
    }

    // 3. Buscar/crear wallet y validar saldo.
    const wallet =
      (await this.wallets.findByCasinoAndPlayer(
        input.casinoId,
        input.actorId,
      )) ??
      (await this.wallets.createForCasinoAndPlayer(
        input.casinoId,
        input.actorId,
      ));

    if (!wallet.active) {
      throw AuthError.validation("wallet is frozen");
    }
    if (wallet.balance < input.bet) {
      throw AuthError.validation("insufficient balance");
    }

    // 4. Débito de la apuesta (atómico, idempotente).
    const debit = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        playerId: input.actorId,
        amount: -input.bet,
        batchId,
        actorId: input.actorId,
        note: `slot bet ${input.bet}`,
        kind: "slot_bet",
        keySuffix: "bet",
      },
    );

    if (debit.status === "failed") {
      throw AuthError.validation(`debit failed: ${debit.reason}`);
    }

    // 5. Rodar y evaluar. El `payout` base sale de la tabla de payouts del
    //    juego (bet × multiplier). Si hay un evento SLOT_DOUBLE activo, el
    //    monto acreditado al wallet — y lo que verá el jugador en su saldo y
    //    en la persistencia del spin — se duplica.
    const result = rollSlotReels();
    const { multiplier, outcome } = evaluateSlotSpin(result);
    const basePayout = input.bet * multiplier;

    const activeEvents = await this.casinoEvents.listActiveByCasino(
      input.casinoId,
    );
    const boosted = applyCasinoEventMultiplier(
      activeEvents,
      "slot_payout",
      basePayout,
    );
    const payout = boosted.amount;
    const net = payout - input.bet;

    // 6. Crédito del payout si aplica.
    let balanceAfter: number;
    if (payout > 0) {
      const baseNote = `slot payout ${multiplier}x on ${result.join(",")}`;
      const noteWithEvents = annotateNoteWithEvents(
        baseNote,
        boosted.appliedEventNames,
        boosted.multiplier,
      );
      const credit = await creditPlayerCore(
        { wallets: this.wallets, walletTxs: this.walletTxs },
        {
          casinoId: input.casinoId,
          playerId: input.actorId,
          amount: payout,
          batchId,
          actorId: input.actorId,
          note: noteWithEvents,
          kind: "slot_payout",
          keySuffix: "payout",
        },
      );
      if (credit.status === "failed" || credit.balance === null) {
        // El débito ya se aplicó; registramos el spin pero con payout=0 real
        // para reflejar el estado efectivo del wallet. El admin puede
        // detectar el caso por el WalletTransaction con status=failed.
        console.warn(
          `[slots] payout credit failed for spin batch=${batchId}: ${credit.status === "failed" ? credit.reason : "null balance"}`,
        );
        const walletAfter = await this.wallets.findByCasinoAndPlayer(
          input.casinoId,
          input.actorId,
        );
        balanceAfter = walletAfter?.balance ?? 0;
      } else {
        balanceAfter = credit.balance;
      }
    } else {
      balanceAfter =
        debit.status === "credited" || debit.status === "recovered"
          ? debit.balance
          : (await this.wallets.findByCasinoAndPlayer(input.casinoId, input.actorId))
              ?.balance ?? 0;
    }

    // 7. Persistir el registro histórico.
    const spin = await this.spins.create({
      casinoId: input.casinoId,
      playerId: input.actorId,
      walletId: wallet.id,
      bet: input.bet,
      result,
      multiplier,
      payout,
      net,
      batchId,
    });

    return { spin, balanceAfter, outcome, replayed: false };
  }
}
