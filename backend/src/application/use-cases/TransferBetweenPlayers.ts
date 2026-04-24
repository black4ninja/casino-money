import type { AppUserRepo } from "../../domain/ports/AppUserRepo.js";
import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { WalletTransactionRepo } from "../../domain/ports/WalletTransactionRepo.js";
import { AuthError } from "../../domain/errors/AuthError.js";
import {
  creditPlayerCore,
  validateAmount,
  validateBatchId,
  type CreditPlayerOutcome,
} from "./helpers/creditPlayerCore.js";

export type TransferBetweenPlayersInput = {
  casinoId: string;
  /** Id del jugador emisor — DEBE coincidir con el caller autenticado. */
  fromPlayerId: string;
  toPlayerId: string;
  /** Monto positivo a transferir. Se aplica como -amount al emisor y +amount al receptor. */
  amount: number;
  batchId: string;
  note: string | null;
};

export type TransferBetweenPlayersResult = {
  batchId: string;
  amount: number;
  fromPlayerId: string;
  toPlayerId: string;
  /** Resultado de la pierna emisora (débito). */
  fromOutcome: CreditPlayerOutcome;
  /** Resultado de la pierna receptora (crédito). */
  toOutcome: CreditPlayerOutcome;
};

/**
 * Transfiere fichas del jugador emisor al receptor dentro del mismo casino.
 *
 * A diferencia de depósito/cobro (que los opera el dealer o master), aquí el
 * actor es el propio jugador emisor: no se pasa `actorId` externo — sale del
 * `fromPlayerId` validado. Idempotente por `batchId`: mismos jugadores y
 * mismo batchId reproducen el mismo resultado sin doble-aplicar.
 *
 * Flujo:
 *   1. Valida casino, amount, batchId.
 *   2. Valida que ambos jugadores existen, son "player", activos, y pertenecen
 *      al roster del casino vía `departamento`.
 *   3. No permite transferir a uno mismo.
 *   4. Verifica saldo suficiente del emisor ANTES de mover dinero.
 *   5. Débito al emisor (`player_transfer_out`, keySuffix="out") — idempotente.
 *   6. Si el débito quedó "credited" o "recovered", crédito al receptor
 *      (`player_transfer_in`, keySuffix="in"). Si el débito no movió saldo
 *      (skipped porque ya se había aplicado), igual intentamos la pierna "in"
 *      — `creditPlayerCore` detectará si ya se aplicó.
 *
 * Trade-off: si el crédito al receptor falla DESPUÉS de que el débito al
 * emisor ya se aplicó, quedamos con dinero "perdido" del emisor. El admin
 * puede detectarlo por WalletTransaction con kind=player_transfer_in y
 * status=failed, y reconciliar manualmente (re-correr con nuevo batchId o
 * revertir vía depósito). Este trade-off es el mismo de la tragamonedas.
 */
export class TransferBetweenPlayersUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly users: AppUserRepo,
    private readonly wallets: WalletRepo,
    private readonly walletTxs: WalletTransactionRepo,
  ) {}

  async execute(
    input: TransferBetweenPlayersInput,
  ): Promise<TransferBetweenPlayersResult> {
    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.tokenInvalid();
    if (!casino.active) throw AuthError.casinoArchived();

    const amountErr = validateAmount(input.amount);
    if (amountErr) throw AuthError.validation(amountErr);

    const batchErr = validateBatchId(input.batchId);
    if (batchErr) throw AuthError.validation(batchErr);

    if (!input.fromPlayerId) throw AuthError.tokenInvalid();
    if (!input.toPlayerId) {
      throw AuthError.validation("toPlayerId is required");
    }
    if (input.fromPlayerId === input.toPlayerId) {
      throw AuthError.validation("No puedes transferirte a ti mismo.");
    }

    const [fromPlayer, toPlayer] = await Promise.all([
      this.users.findById(input.fromPlayerId),
      this.users.findById(input.toPlayerId),
    ]);

    if (!fromPlayer) throw AuthError.tokenInvalid();
    if (fromPlayer.role !== "player") {
      throw AuthError.validation(
        "Solo los jugadores pueden transferir sus fichas.",
      );
    }
    if (!fromPlayer.active) throw AuthError.inactiveAccount();
    if (
      fromPlayer.departamento === null ||
      !casino.departamentos.includes(fromPlayer.departamento)
    ) {
      throw AuthError.validation(
        "No estás registrado en el roster de este casino.",
      );
    }

    if (!toPlayer) throw AuthError.validation("El destinatario no existe.");
    if (toPlayer.role !== "player") {
      throw AuthError.validation("El destinatario no es un jugador.");
    }
    if (!toPlayer.active) {
      throw AuthError.validation("El destinatario está archivado.");
    }
    if (
      toPlayer.departamento === null ||
      !casino.departamentos.includes(toPlayer.departamento)
    ) {
      throw AuthError.validation(
        "El destinatario no forma parte de este casino.",
      );
    }

    // Validar saldo suficiente del emisor ANTES de mover dinero. El helper
    // `creditPlayerCore` aplica el delta sin clamp, así que es nuestra
    // responsabilidad evitar saldos negativos.
    const fromWallet = await this.wallets.findByCasinoAndPlayer(
      input.casinoId,
      input.fromPlayerId,
    );
    const fromBalance = fromWallet?.balance ?? 0;
    if (fromBalance < input.amount) {
      throw AuthError.validation(
        `Saldo insuficiente: tienes $${fromBalance}, intentaste transferir $${input.amount}.`,
      );
    }

    const trimmedBatchId = input.batchId.trim();

    // Pierna 1: débito al emisor. El actor es el propio emisor.
    const fromOutcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        playerId: input.fromPlayerId,
        amount: -input.amount,
        batchId: trimmedBatchId,
        actorId: input.fromPlayerId,
        note: input.note,
        kind: "player_transfer_out",
        keySuffix: "out",
      },
    );

    if (fromOutcome.status === "failed") {
      throw AuthError.validation(
        `No se pudo descontar del emisor: ${fromOutcome.reason}`,
      );
    }

    // Pierna 2: crédito al receptor. Reintentos con el mismo batchId
    // regresan "skipped" en esta pierna también.
    const toOutcome = await creditPlayerCore(
      { wallets: this.wallets, walletTxs: this.walletTxs },
      {
        casinoId: input.casinoId,
        playerId: input.toPlayerId,
        amount: input.amount,
        batchId: trimmedBatchId,
        actorId: input.fromPlayerId,
        note: input.note,
        kind: "player_transfer_in",
        keySuffix: "in",
      },
    );

    return {
      batchId: trimmedBatchId,
      amount: input.amount,
      fromPlayerId: input.fromPlayerId,
      toPlayerId: input.toPlayerId,
      fromOutcome,
      toOutcome,
    };
  }
}
