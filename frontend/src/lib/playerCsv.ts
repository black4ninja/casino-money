/**
 * CSV utilities for the player bulk-import flow. Intentionally minimal —
 * we don't pull in a dependency (papaparse) for a 3-column form.
 *
 * Format contract (both template and import):
 *   - UTF-8, comma-separated
 *   - First row is the header: matricula,nombre,departamento
 *   - Values may be wrapped in double quotes; quotes are escaped by doubling
 *   - Leading BOM (﻿) is tolerated (Excel adds it on "Save as CSV UTF-8")
 *   - Empty rows are skipped
 */

export const CSV_HEADERS = ["matricula", "nombre", "departamento"] as const;

export type ParsedPlayerRow = {
  /** 1-based row number in the CSV file, counted AFTER the header row. */
  rowNumber: number;
  matricula: string;
  nombre: string;
  departamento: string;
  /** Blocking validation issues; if length > 0 the row must not be submitted. */
  errors: string[];
};

export type ParsedCsv = {
  rows: ParsedPlayerRow[];
  /** Parse-level issues (missing headers, unreadable file, etc). */
  fatal: string | null;
};

/**
 * RFC-4180-ish row splitter. Handles quoted fields, escaped quotes (""),
 * and trailing \r from Windows line endings.
 */
function splitRow(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ",") {
      cells.push(cell);
      cell = "";
      i++;
      continue;
    }
    cell += ch;
    i++;
  }
  cells.push(cell);
  return cells.map((c) => c.replace(/\r$/, ""));
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function parsePlayerCsv(raw: string): ParsedCsv {
  const text = raw.replace(/^﻿/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { rows: [], fatal: "El archivo está vacío" };
  }

  const firstLine = lines[0] ?? "";
  const headerCells = splitRow(firstLine).map(normalizeHeader);
  const idxMatricula = headerCells.indexOf("matricula");
  const idxNombre = headerCells.indexOf("nombre");
  const idxDepto = headerCells.indexOf("departamento");
  if (idxMatricula === -1) {
    return {
      rows: [],
      fatal: "Falta la columna 'matricula' en el encabezado",
    };
  }

  const seen = new Set<string>();
  const rows: ParsedPlayerRow[] = [];
  for (let li = 1; li < lines.length; li++) {
    const rawLine = lines[li] ?? "";
    const cells = splitRow(rawLine);
    // Tolerate fully-blank rows (all cells empty/whitespace).
    if (cells.every((c) => c.trim() === "")) continue;

    const matricula = (cells[idxMatricula] ?? "").trim();
    const nombre = idxNombre >= 0 ? (cells[idxNombre] ?? "").trim() : "";
    const departamento = idxDepto >= 0 ? (cells[idxDepto] ?? "").trim() : "";

    const errors: string[] = [];
    if (!matricula) errors.push("Matrícula vacía");
    if (matricula && seen.has(matricula)) {
      errors.push("Matrícula duplicada en el archivo");
    }
    if (matricula) seen.add(matricula);

    rows.push({
      rowNumber: rows.length + 1,
      matricula,
      nombre,
      departamento,
      errors,
    });
  }

  return { rows, fatal: null };
}

/**
 * Triggers a browser download of an empty CSV template with the expected
 * headers and one example row so the user can't confuse the schema.
 * BOM is prepended so Excel opens it as UTF-8 without mojibake.
 */
export function downloadPlayerCsvTemplate(): void {
  const header = CSV_HEADERS.join(",");
  const example = "A01234567,Ejemplo Pérez,ITC";
  const csv = `﻿${header}\n${example}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_jugadores.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
