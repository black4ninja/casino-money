import type { CreateUserUseCase } from "./CreateUser.js";
import { AuthError } from "../../domain/errors/AuthError.js";

export type BulkPlayerRow = {
  matricula: string;
  fullName?: string | null;
  departamento?: string | null;
};

export type BulkCreateResult =
  | { row: number; matricula: string; status: "created"; userId: string }
  | {
      row: number;
      matricula: string;
      status: "error";
      code: string;
      message: string;
    };

export type BulkCreatePlayersOutput = {
  results: BulkCreateResult[];
  summary: { total: number; created: number; failed: number };
};

/**
 * Creates players from a CSV-style batch. Each row is attempted independently
 * so a partial failure (e.g. one duplicate matrícula) does not block the rest
 * of the import. Clients render a per-row report from `results`.
 *
 * Intra-batch duplicates are caught here too so we don't hit the DB for a
 * row whose matrícula is already being created earlier in the same request.
 */
export class BulkCreatePlayersUseCase {
  constructor(private readonly createUser: CreateUserUseCase) {}

  async execute(rows: BulkPlayerRow[]): Promise<BulkCreatePlayersOutput> {
    const results: BulkCreateResult[] = [];
    const seen = new Set<string>();
    let created = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as BulkPlayerRow;
      const rowNumber = i + 1;
      const matricula = (row.matricula ?? "").trim();

      if (!matricula) {
        failed++;
        results.push({
          row: rowNumber,
          matricula,
          status: "error",
          code: "INVALID_MATRICULA",
          message: "Matrícula vacía",
        });
        continue;
      }

      if (seen.has(matricula)) {
        failed++;
        results.push({
          row: rowNumber,
          matricula,
          status: "error",
          code: "DUPLICATE_IN_BATCH",
          message: "Matrícula duplicada en el archivo",
        });
        continue;
      }
      seen.add(matricula);

      try {
        const fullName =
          typeof row.fullName === "string" && row.fullName.trim()
            ? row.fullName.trim()
            : null;
        const departamento =
          typeof row.departamento === "string" && row.departamento.trim()
            ? row.departamento.trim()
            : null;
        const user = await this.createUser.execute({
          matricula,
          role: "player",
          fullName,
          departamento,
        });
        created++;
        results.push({
          row: rowNumber,
          matricula,
          status: "created",
          userId: user.id,
        });
      } catch (err) {
        failed++;
        if (err instanceof AuthError) {
          results.push({
            row: rowNumber,
            matricula,
            status: "error",
            code: err.code,
            message: err.message,
          });
        } else {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({
            row: rowNumber,
            matricula,
            status: "error",
            code: "UNKNOWN_ERROR",
            message: msg,
          });
        }
      }
    }

    return {
      results,
      summary: { total: rows.length, created, failed },
    };
  }
}
