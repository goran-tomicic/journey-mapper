# Changelog

Release log for journey-mapper. One entry per feature branch, added when it merges.

## [Unreleased]

### Added
- Extraction agent: reads interview transcripts from `data/transcripts/`, calls Claude (structured JSON output, `messages.parse` + Zod schema) to extract `{ step, emotion, quote, pain_point, opportunity }` per transcript, then merges multiple transcripts into one journey map, noting disagreements between sources instead of silently picking one. Run with `npm run extract`; output written to `data/output/journey.json`.

### Fixed
- `tsconfig.json` now sets `rootDir: "src"` explicitly alongside `outDir`, clearing a TS6059 warning in editors.
