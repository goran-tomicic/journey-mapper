import "dotenv/config";
import { readdir, readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { extractJourney } from "./extract.js";
import { mergeJourneys } from "./merge.js";
import type { Extraction, TranscriptSource } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSCRIPTS_DIR = path.join(__dirname, "..", "data", "transcripts");
const OUTPUT_DIR = path.join(__dirname, "..", "data", "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "journey.json");

async function loadTranscripts(): Promise<TranscriptSource[]> {
  const files = (await readdir(TRANSCRIPTS_DIR)).filter((f) => f.endsWith(".txt")).sort();
  return Promise.all(
    files.map(async (file) => ({
      id: path.basename(file, ".txt"),
      text: await readFile(path.join(TRANSCRIPTS_DIR, file), "utf-8"),
    })),
  );
}

async function main() {
  const transcripts = await loadTranscripts();
  if (transcripts.length === 0) {
    throw new Error(`No transcripts found in ${TRANSCRIPTS_DIR}`);
  }

  console.log(`Extracting from ${transcripts.length} transcript(s)...`);
  const extractions: Record<string, Extraction> = {};
  for (const transcript of transcripts) {
    console.log(`  - ${transcript.id}`);
    extractions[transcript.id] = await extractJourney(transcript);
  }

  console.log("Merging into a single journey map...");
  const merged = await mergeJourneys(extractions);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, JSON.stringify(merged, null, 2));
  console.log(`Wrote ${merged.steps.length} steps to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
