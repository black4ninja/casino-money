import { useMemo, useRef, useState } from "react";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { Badge } from "../atoms/Badge";
import {
  parsePlayerCsv,
  downloadPlayerCsvTemplate,
  type ParsedCsv,
  type ParsedPlayerRow,
} from "@/lib/playerCsv";
import type {
  BulkImportResponse,
  BulkImportResult,
  BulkImportPlayerRow,
} from "@/lib/authApi";

type Props = {
  onCancel: () => void;
  /**
   * Submits the batch. The parent owns the auth-refresh/retry logic so the
   * modal stays a pure presentational boundary.
   */
  onImport: (rows: BulkImportPlayerRow[]) => Promise<BulkImportResponse>;
};

type Phase =
  | { kind: "pick" }
  | { kind: "preview"; fileName: string; parsed: ParsedCsv }
  | {
      kind: "submitting";
      fileName: string;
      parsed: ParsedCsv;
    }
  | {
      kind: "result";
      fileName: string;
      parsed: ParsedCsv;
      response: BulkImportResponse;
    };

function rowError(row: ParsedPlayerRow): string | null {
  return row.errors.length > 0 ? row.errors.join("; ") : null;
}

function StatusCell({ text, tone }: { text: string; tone: "success" | "danger" | "neutral" }) {
  return <Badge tone={tone}>{text}</Badge>;
}

export function ImportPlayersModal({ onCancel, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "pick" });
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validRows = useMemo(() => {
    if (phase.kind !== "preview" && phase.kind !== "submitting") return [];
    return phase.parsed.rows.filter((r) => r.errors.length === 0);
  }, [phase]);

  async function handleFile(file: File) {
    setFileError(null);
    setSubmitError(null);
    try {
      const text = await file.text();
      const parsed = parsePlayerCsv(text);
      if (parsed.fatal) {
        setFileError(parsed.fatal);
        return;
      }
      if (parsed.rows.length === 0) {
        setFileError("El archivo no contiene filas de datos");
        return;
      }
      setPhase({ kind: "preview", fileName: file.name, parsed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo leer el archivo";
      setFileError(msg);
    }
  }

  async function handleSubmit() {
    if (phase.kind !== "preview") return;
    const toSubmit: BulkImportPlayerRow[] = validRows.map((r) => ({
      matricula: r.matricula,
      fullName: r.nombre || null,
      departamento: r.departamento || null,
    }));
    if (toSubmit.length === 0) {
      setSubmitError("No hay filas válidas para importar");
      return;
    }
    setSubmitError(null);
    setPhase({ kind: "submitting", fileName: phase.fileName, parsed: phase.parsed });
    try {
      const response = await onImport(toSubmit);
      setPhase({
        kind: "result",
        fileName: phase.fileName,
        parsed: phase.parsed,
        response,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo importar";
      setSubmitError(msg);
      setPhase({ kind: "preview", fileName: phase.fileName, parsed: phase.parsed });
    }
  }

  function reset() {
    setPhase({ kind: "pick" });
    setFileError(null);
    setSubmitError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const busy = phase.kind === "submitting";

  return (
    <Card tone="night">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h3 className="font-display text-xl text-[--color-ivory]">
            Importar jugadores desde CSV
          </h3>
          <p className="text-xs text-[--color-cream]/60 mt-1">
            Columnas requeridas:{" "}
            <span className="font-mono text-[--color-gold-300]">matricula</span>,{" "}
            <span className="font-mono text-[--color-gold-300]">nombre</span>,{" "}
            <span className="font-mono text-[--color-gold-300]">departamento</span>
          </p>
        </div>
        <Button
          type="button"
          variant="gold"
          size="sm"
          onClick={() => downloadPlayerCsvTemplate()}
        >
          Descargar plantilla
        </Button>
      </div>

      {phase.kind === "pick" && (
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-label text-xs text-[--color-cream]/70">
              Archivo CSV
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="text-sm text-[--color-cream] file:mr-3 file:rounded-full file:border-0 file:bg-[--color-gold-500] file:px-4 file:py-2 file:font-label file:text-[--color-smoke] file:cursor-pointer"
            />
          </label>
          {fileError && (
            <p className="text-sm text-[--color-carmine-400]" role="alert">
              {fileError}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {(phase.kind === "preview" || phase.kind === "submitting") && (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono text-[--color-cream]/70">
              {phase.fileName}
            </span>
            <Badge tone="success">{validRows.length} válidas</Badge>
            {phase.parsed.rows.length - validRows.length > 0 && (
              <Badge tone="danger">
                {phase.parsed.rows.length - validRows.length} con errores
              </Badge>
            )}
            <button
              type="button"
              className="ml-auto text-xs underline text-[--color-cream]/70 hover:text-[--color-ivory] disabled:opacity-50"
              onClick={reset}
              disabled={busy}
            >
              Cambiar archivo
            </button>
          </div>

          <div className="max-h-72 overflow-auto rounded-xl bg-[--color-smoke]/60 ring-1 ring-inset ring-white/5">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[--color-smoke-800] text-[--color-cream]/70">
                <tr className="text-left">
                  <th className="px-3 py-2 font-label text-xs">#</th>
                  <th className="px-3 py-2 font-label text-xs">Matrícula</th>
                  <th className="px-3 py-2 font-label text-xs">Nombre</th>
                  <th className="px-3 py-2 font-label text-xs">Departamento</th>
                  <th className="px-3 py-2 font-label text-xs">Estado</th>
                </tr>
              </thead>
              <tbody>
                {phase.parsed.rows.map((row) => {
                  const err = rowError(row);
                  return (
                    <tr
                      key={row.rowNumber}
                      className="border-t border-white/5 align-top"
                    >
                      <td className="px-3 py-2 text-[--color-cream]/60 text-xs">
                        {row.rowNumber}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-[--color-cream]">
                        {row.matricula || "—"}
                      </td>
                      <td className="px-3 py-2 text-[--color-ivory]">
                        {row.nombre || (
                          <span className="text-[--color-cream]/40">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[--color-ivory]">
                        {row.departamento || (
                          <span className="text-[--color-cream]/40">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {err ? (
                          <div className="flex flex-col gap-1">
                            <StatusCell text="error" tone="danger" />
                            <span className="text-xs text-[--color-carmine-400]">
                              {err}
                            </span>
                          </div>
                        ) : (
                          <StatusCell text="válida" tone="success" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {submitError && (
            <p className="text-sm text-[--color-carmine-400]" role="alert">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={busy || validRows.length === 0}
            >
              {busy ? "Importando…" : `Importar ${validRows.length} jugador(es)`}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {phase.kind === "result" && (
        <ResultView
          response={phase.response}
          onClose={onCancel}
          onImportAnother={reset}
        />
      )}
    </Card>
  );
}

function ResultView({
  response,
  onClose,
  onImportAnother,
}: {
  response: BulkImportResponse;
  onClose: () => void;
  onImportAnother: () => void;
}) {
  const { summary, results } = response;
  const failed = results.filter(
    (r): r is Extract<BulkImportResult, { status: "error" }> =>
      r.status === "error",
  );
  const createdCount = summary.created;

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Badge tone="success">{createdCount} creados</Badge>
        {summary.failed > 0 && <Badge tone="danger">{summary.failed} fallidos</Badge>}
        <Badge tone="neutral">{summary.total} total</Badge>
      </div>

      {failed.length > 0 && (
        <div className="max-h-64 overflow-auto rounded-xl bg-[--color-smoke]/60 ring-1 ring-inset ring-white/5">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[--color-smoke-800] text-[--color-cream]/70">
              <tr className="text-left">
                <th className="px-3 py-2 font-label text-xs">#</th>
                <th className="px-3 py-2 font-label text-xs">Matrícula</th>
                <th className="px-3 py-2 font-label text-xs">Error</th>
              </tr>
            </thead>
            <tbody>
              {failed.map((r) => (
                <tr
                  key={`${r.row}-${r.matricula}`}
                  className="border-t border-white/5"
                >
                  <td className="px-3 py-2 text-[--color-cream]/60 text-xs">
                    {r.row}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[--color-cream]">
                    {r.matricula || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs text-[--color-carmine-400]">
                    {r.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="primary" onClick={onClose}>
          Listo
        </Button>
        <Button type="button" variant="ghost" onClick={onImportAnother}>
          Importar otro archivo
        </Button>
      </div>
    </div>
  );
}
