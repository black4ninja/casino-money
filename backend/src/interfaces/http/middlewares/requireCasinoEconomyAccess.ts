import type { RequestHandler } from "express";
import type { MesaRepo } from "../../../domain/ports/MesaRepo.js";
import { AuthError } from "../../../domain/errors/AuthError.js";

/**
 * Autorización para endpoints anidados bajo `/api/v1/casinos/:casinoId/economy`.
 *
 * Reglas:
 *   - master            → siempre autorizado (gobierno global de la economía).
 *   - dealer            → autorizado SOLO si tiene al menos una mesa activa
 *                         asignada en ese casino. El dealer paga/consulta
 *                         dentro de su propia jornada; no debería ver otros
 *                         casinos donde no opera.
 *   - player            → nunca (los players acceden a su saldo vía /me/).
 *
 * Se usa en lugar del middleware `requireMaster` que antes gateaba todas las
 * rutas de economía. Las validaciones más granulares (casino activo, jugador
 * en roster, amount válido, etc.) viven en los use cases aguas abajo; este
 * middleware solo resuelve "¿puede el caller operar la economía de este
 * casino?".
 */
export function requireCasinoEconomyAccess(mesas: MesaRepo): RequestHandler {
  return async (req, _res, next) => {
    try {
      const user = req.user;
      if (!user) return next(AuthError.tokenInvalid());
      if (user.role === "master") return next();
      if (user.role !== "dealer") {
        return next(
          AuthError.validation(
            `Solo master o dealer pueden operar economía de un casino (rol actual: ${user.role}).`,
          ),
        );
      }

      const casinoId = req.params.casinoId;
      if (typeof casinoId !== "string" || !casinoId) {
        return next(AuthError.validation("casinoId required"));
      }

      const dealerMesas = await mesas.listByTallador(user.sub);
      const mesasInCasino = dealerMesas.filter((m) => m.casinoId === casinoId);
      const hasActiveMesaInCasino = mesasInCasino.some((m) => m.active);

      if (!hasActiveMesaInCasino) {
        if (mesasInCasino.length === 0) {
          // Log para diagnóstico: el dealer no tiene NINGUNA mesa en este casino.
          console.warn(
            `[econ-access] dealer=${user.sub} tiene ${dealerMesas.length} mesa(s) asignadas pero ninguna en casino=${casinoId}. casinoIds vistos: ${dealerMesas.map((m) => m.casinoId).join(",") || "(ninguno)"}`,
          );
          return next(
            AuthError.validation(
              "No tienes ninguna mesa asignada en este casino.",
            ),
          );
        }
        return next(
          AuthError.validation(
            "Tus mesas en este casino están archivadas. Pide al maestro que las reactive.",
          ),
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
