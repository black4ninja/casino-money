#!/usr/bin/env node
/**
 * One-shot optimizer for the handful of non-pattern assets we ship from
 * /public/images/. Each entry picks its own max width because the display
 * contexts are very different: a fullscreen background (cover) vs a small
 * decorative mascot. Rerun this script whenever the source files change.
 */
import { stat } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const IMAGES_DIR = join(__dirname, "..", "public", "images");

const BANNER_SETTINGS = { maxWidth: 1600, avifQuality: 55, webpQuality: 82 };

const TARGETS = [
  {
    src: join(IMAGES_DIR, "landing-bg.jpg"),
    maxWidth: 2560,
    avifQuality: 55,
    webpQuality: 82,
  },
  {
    src: join(IMAGES_DIR, "phanphy-joker.png"),
    maxWidth: 800,
    avifQuality: 55,
    webpQuality: 85,
  },
  { src: join(IMAGES_DIR, "banners", "patterns.png"), ...BANNER_SETTINGS },
  { src: join(IMAGES_DIR, "banners", "antipatterns.png"), ...BANNER_SETTINGS },
  { src: join(IMAGES_DIR, "banners", "creational.png"), ...BANNER_SETTINGS },
  { src: join(IMAGES_DIR, "banners", "structural.png"), ...BANNER_SETTINGS },
  { src: join(IMAGES_DIR, "banners", "behavioral.png"), ...BANNER_SETTINGS },
];

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0).padStart(5)} KB`;
}

async function main() {
  let totalBefore = 0;
  let totalAvif = 0;
  let totalWebp = 0;

  for (const { src, maxWidth, avifQuality, webpQuality } of TARGETS) {
    const ext = extname(src);
    const id = basename(src, ext);
    const dir = dirname(src);
    const avifOut = join(dir, `${id}.avif`);
    const webpOut = join(dir, `${id}.webp`);

    let beforeSize;
    try {
      beforeSize = (await stat(src)).size;
    } catch (e) {
      if (e.code === "ENOENT") {
        console.log(`${id.padEnd(20)} (skipped — source missing)`);
        continue;
      }
      throw e;
    }
    totalBefore += beforeSize;

    const pipeline = sharp(src).resize({
      width: maxWidth,
      withoutEnlargement: true,
      fit: "inside",
    });

    await pipeline.clone().avif({ quality: avifQuality, effort: 6 }).toFile(avifOut);
    await pipeline.clone().webp({ quality: webpQuality }).toFile(webpOut);

    const { size: avifSize } = await stat(avifOut);
    const { size: webpSize } = await stat(webpOut);
    totalAvif += avifSize;
    totalWebp += webpSize;

    console.log(
      `${id.padEnd(20)} (${maxWidth}w)  ${ext.slice(1).toUpperCase().padStart(3)} ${fmtKB(beforeSize)}  →  AVIF ${fmtKB(avifSize)}  ·  WEBP ${fmtKB(webpSize)}`,
    );
  }

  console.log("─".repeat(80));
  console.log(
    `TOTAL (${TARGETS.length} files)     SRC ${fmtKB(totalBefore)}  →  AVIF ${fmtKB(totalAvif)}  ·  WEBP ${fmtKB(totalWebp)}`,
  );
  console.log(
    `AVIF savings: ${((1 - totalAvif / totalBefore) * 100).toFixed(1)}%  ·  WEBP savings: ${((1 - totalWebp / totalBefore) * 100).toFixed(1)}%`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
