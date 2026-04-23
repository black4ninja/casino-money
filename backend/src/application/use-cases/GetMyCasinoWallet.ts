import type { CasinoRepo } from "../../domain/ports/CasinoRepo.js";
import type { WalletRepo } from "../../domain/ports/WalletRepo.js";
import type { Role } from "../../domain/entities/Role.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type GetMyCasinoWalletInput = {
  actorId: string;
  actorRole: Role;
  casinoId: string;
};

export type GetMyCasinoWalletResult = {
  balance: number;
  active: boolean;
  /** `true` si el wallet aún no existe en DB (el jugador no ha tenido movimiento). */
  lazy: boolean;
};

/**
 * Devuelve el saldo del jugador autenticado en un casino específico. Si aún
 * no tiene wallet (nadie le ha depositado), devuelve balance=0, lazy=true —
 * el caller puede mostrarlo como "Sin saldo" sin tener que crear el wallet
 * (se creará en el primer flujo de dinero que lo requiera).
 */
export class GetMyCasinoWalletUseCase {
  constructor(
    private readonly casinos: CasinoRepo,
    private readonly wallets: WalletRepo,
  ) {}

  async execute(input: GetMyCasinoWalletInput): Promise<GetMyCasinoWalletResult> {
    if (!input.actorId) throw AuthError.tokenInvalid();

    const casino = await this.casinos.findById(input.casinoId);
    if (!casino) throw AuthError.validation("casino not found");

    // Lectura tolerante: cualquier rol autenticado puede consultar su saldo
    // en un casino (master/dealer simplemente no tienen wallet y devolverán
    // balance=0, lazy=true). La restricción de "solo players juegan" vive
    // en `PlaySlotMachineSpin`, no aquí — así la página carga sin fricción
    // incluso para usuarios que solo la están explorando.
    const wallet = await this.wallets.findByCasinoAndPlayer(
      input.casinoId,
      input.actorId,
    );
    if (!wallet) {
      return { balance: 0, active: true, lazy: true };
    }
    return { balance: wallet.balance, active: wallet.active, lazy: false };
  }
}
