# journey-mapper

Extracts a structured customer journey — steps, emotions, quotes, pain points, opportunities — from raw interview transcripts, and renders it as a color-coded visual map.

See `docs/SPEC.md` for scope and `CLAUDE.md` for build instructions.

## Setup

1. `cp .env.example .env` and fill in your Anthropic API key
2. `npm install`
3. `npm run extract` — reads every transcript in `data/transcripts/`, extracts a journey per transcript, merges them into one journey map, and writes `data/output/journey.json`
   - Optionally pass a short description of the journey being investigated to steer extraction: `npm run extract -- "onboarding a new B2B SaaS user"`
4. `npm run render` — reads `data/output/journey.json` and writes `data/output/journey.html`, a horizontal step map color-coded by emotion

Open `data/output/journey.html` in a browser to view the result.

## How it works

1. **Extract** (`src/extract.ts`) — each transcript in `data/transcripts/` is sent to Claude with a forced JSON schema (`messages.parse` + Zod), returning an ordered list of journey steps: `{ step, emotion, quote, pain_point, opportunity }`.
2. **Merge** (`src/merge.ts`) — when more than one transcript is present, a second Claude call reconciles them into a single journey map. Steps describing the same stage are combined; where transcripts disagree on emotion or pain points, the step is annotated with a `disagreement` note instead of one source being silently preferred.
3. **Render** (`src/render.ts`) — the merged journey is turned into a static, self-contained HTML page: a horizontal row of step cards, color-coded by emotion (frustrated / neutral / delighted), each showing its quote, pain point, opportunity, contributing sources, and any disagreement note.

## Output schema

Each step in `data/output/journey.json`:

```jsonc
{
  "step": "Team invite and role/permission assignment",
  "emotion": "frustrated", // "frustrated" | "neutral" | "delighted"
  "quote": "...", // verbatim, from one source transcript
  "pain_point": "...", // empty string if none
  "opportunity": "...", // empty string if none
  "sources": ["transcript-1"], // transcript ids this step draws from
  "disagreement": null, // note describing conflicting sources, or null
}
```

## Project structure

```
data/transcripts/   fictional interview transcripts (input)
data/output/        generated journey.json and journey.html (gitignored)
src/extract.ts       per-transcript extraction
src/merge.ts         multi-transcript merge + disagreement notes
src/render.ts        static HTML renderer
src/index.ts         orchestrates extract -> merge -> journey.json
src/types.ts         shared Zod schemas / types
```
