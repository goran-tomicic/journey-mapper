import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { MergedJourneySchema, type MergedStep } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT_FILE = path.join(__dirname, "..", "data", "output", "journey.json");
const OUTPUT_FILE = path.join(__dirname, "..", "data", "output", "journey.html");

const EMOTION_STYLE: Record<MergedStep["emotion"], { bg: string; border: string; label: string }> = {
  frustrated: { bg: "#fdecea", border: "#e74c3c", label: "😠 Frustrated" },
  neutral: { bg: "#f2f4f5", border: "#8896a3", label: "😐 Neutral" },
  delighted: { bg: "#e9f9ee", border: "#27ae60", label: "😊 Delighted" },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderStep(step: MergedStep, index: number): string {
  const style = EMOTION_STYLE[step.emotion];
  const disagreement = step.disagreement
    ? `<div class="disagreement">⚠️ ${escapeHtml(step.disagreement)}</div>`
    : "";
  const painPoint = step.pain_point
    ? `<div class="field"><span class="field-label">Pain point</span>${escapeHtml(step.pain_point)}</div>`
    : "";
  const opportunity = step.opportunity
    ? `<div class="field"><span class="field-label">Opportunity</span>${escapeHtml(step.opportunity)}</div>`
    : "";

  return `
    <div class="step" style="background:${style.bg}; border-color:${style.border};">
      <div class="step-index">${index + 1}</div>
      <h3>${escapeHtml(step.step)}</h3>
      <div class="emotion" style="color:${style.border};">${style.label}</div>
      <blockquote>&ldquo;${escapeHtml(step.quote)}&rdquo;</blockquote>
      ${painPoint}
      ${opportunity}
      ${disagreement}
      <div class="sources">Sources: ${step.sources.map(escapeHtml).join(", ")}</div>
    </div>`;
}

function renderPage(steps: MergedStep[]): string {
  const cards = steps.map(renderStep).join("\n<div class=\"arrow\">&rarr;</div>\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Customer Journey Map</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2rem 1rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #fafbfc;
    color: #1c2733;
  }
  h1 {
    text-align: center;
    margin-bottom: 0.25rem;
  }
  .subtitle {
    text-align: center;
    color: #5a6b7a;
    margin-bottom: 2rem;
  }
  .map {
    display: flex;
    align-items: stretch;
    gap: 0.5rem;
    overflow-x: auto;
    padding: 1rem 0.5rem 2rem;
  }
  .step {
    flex: 0 0 260px;
    border: 2px solid;
    border-radius: 12px;
    padding: 1rem;
    position: relative;
  }
  .step-index {
    position: absolute;
    top: -0.6rem;
    left: -0.6rem;
    background: #1c2733;
    color: #fff;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .step h3 {
    margin: 0.25rem 0 0.5rem;
    font-size: 1.05rem;
  }
  .emotion {
    font-weight: 600;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
  blockquote {
    margin: 0 0 0.75rem;
    padding-left: 0.75rem;
    border-left: 3px solid rgba(0,0,0,0.15);
    font-style: italic;
    font-size: 0.9rem;
    color: #33414d;
  }
  .field {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
    line-height: 1.35;
  }
  .field-label {
    display: block;
    font-weight: 600;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: #5a6b7a;
    margin-bottom: 0.15rem;
  }
  .disagreement {
    font-size: 0.8rem;
    background: #fff6e0;
    border: 1px solid #e0b93d;
    border-radius: 6px;
    padding: 0.4rem 0.5rem;
    margin-bottom: 0.5rem;
  }
  .sources {
    font-size: 0.75rem;
    color: #7c8b98;
  }
  .arrow {
    align-self: center;
    font-size: 1.5rem;
    color: #b7c1c9;
    flex: 0 0 auto;
  }
  .legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }
</style>
</head>
<body>
  <h1>Customer Journey Map</h1>
  <div class="subtitle">B2B SaaS onboarding — extracted from interview transcripts</div>
  <div class="legend">
    <span style="color:${EMOTION_STYLE.frustrated.border};">${EMOTION_STYLE.frustrated.label}</span>
    <span style="color:${EMOTION_STYLE.neutral.border};">${EMOTION_STYLE.neutral.label}</span>
    <span style="color:${EMOTION_STYLE.delighted.border};">${EMOTION_STYLE.delighted.label}</span>
  </div>
  <div class="map">
    ${cards}
  </div>
</body>
</html>
`;
}

async function main() {
  const raw = JSON.parse(await readFile(INPUT_FILE, "utf-8"));
  const journey = MergedJourneySchema.parse(raw);

  const html = renderPage(journey.steps);
  await mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await writeFile(OUTPUT_FILE, html);
  console.log(`Wrote ${journey.steps.length} steps to ${path.relative(process.cwd(), OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
