#!/usr/bin/env node
/**
 * Batch-optimize PNG artwork to AVIF + WebP. Defaults to the design-patterns
 * folder; pass a subfolder name under public/images/ as an arg to point it
 * elsewhere (e.g. `node optimize-patterns.mjs antipatterns`). Re-runnable;
 * overwrites outputs. Rerun whenever source art changes.
 */
import { readdir, stat } from "node:fs/promises";
import { extname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const TARGET = process.argv[2] ?? "patterns";
const DIR = join(__dirname, "..", "public", "images", TARGET);
const MAX_WIDTH = 1200;
const AVIF_QUALITY = 50;
const WEBP_QUALITY = 80;

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0).padStart(5)} KB`;
}

async function main() {
  const entries = await readdir(DIR);
  const pngs = entries.filter((f) => extname(f).toLowerCase() === ".png").sort();
  if (pngs.length === 0) {
    console.log(`No PNG files found in ${DIR}`);
    return;
  }

  console.log(`Optimizing ${pngs.length} files in ${TARGET}/`);

  let totalBefore = 0;
  let totalAvif = 0;
  let totalWebp = 0;

  for (const file of pngs) {
    const id = basename(file, ".png");
    const src = join(DIR, file);
    const avifOut = join(DIR, `${id}.avif`);
    const webpOut = join(DIR, `${id}.webp`);

    const { size: beforeSize } = await stat(src);
    totalBefore += beforeSize;

    const pipeline = sharp(src).resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
      fit: "inside",
    });

    await pipeline.clone().avif({ quality: AVIF_QUALITY, effort: 6 }).toFile(avifOut);
    await pipeline.clone().webp({ quality: WEBP_QUALITY }).toFile(webpOut);

    const { size: avifSize } = await stat(avifOut);
    const { size: webpSize } = await stat(webpOut);
    totalAvif += avifSize;
    totalWebp += webpSize;

    console.log(
      `${id.padEnd(26)}  PNG ${fmtKB(beforeSize)}  →  AVIF ${fmtKB(avifSize)}  ·  WEBP ${fmtKB(webpSize)}`,
    );
  }

  console.log("─".repeat(80));
  console.log(
    `TOTAL (${pngs.length} files)        PNG ${fmtKB(totalBefore)}  →  AVIF ${fmtKB(totalAvif)}  ·  WEBP ${fmtKB(totalWebp)}`,
  );
  const avifSavings = ((1 - totalAvif / totalBefore) * 100).toFixed(1);
  const webpSavings = ((1 - totalWebp / totalBefore) * 100).toFixed(1);
  console.log(`AVIF savings: ${avifSavings}%  ·  WEBP savings: ${webpSavings}%`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
