// NationScope hand-in: copies app/ and screenshots/ beside this file into the
// output directory and writes the dossier the judge reads, using the vendored
// make.fun library (vendor/makefun-frontend.ts, unchanged from the kit).
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The scorer's own caps, as the kit's RULES.txt states them: the dossier text
// is capped at 160 KiB, at most 4 screenshots of 256 KiB each, and app/ holds
// at most 993 files and directories totalling 16 MiB.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
};

const ROOT = dirname(fileURLToPath(import.meta.url));

function outputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
}

async function copyTree(from, to) {
  await mkdir(dirname(to), { recursive: true });
  await cp(from, to, { recursive: true });
}

async function handIn() {
  const out = outputDir();
  await mkdir(out, { recursive: true });
  await copyTree(join(ROOT, "app"), join(out, "app"));
  // The gate refuses an entry whose app/ has no index.html, so fail loudly
  // here instead of handing in a broken directory.
  if (!existsSync(join(out, "app", "index.html"))) {
    throw new Error("hand-in refused: app/index.html is missing");
  }
  const shots = join(ROOT, "screenshots");
  if (existsSync(shots)) {
    await copyTree(shots, join(out, "screenshots"));
  }
  const dossier = buildDossier(out, DOSSIER_LIMITS);
  await writeFile(join(out, "dossier.json"), dossier);
  return out;
}

const handedIn = await handIn();
console.log("NationScope handed in to " + handedIn);
