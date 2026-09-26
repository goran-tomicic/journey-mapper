# journey-mapper

See `docs/SPEC.md` for scope and `CLAUDE.md` for build instructions.

## Setup
1. `cp .env.example .env` and fill in your Anthropic API key
2. `npm install`
3. `npm run extract` — reads every transcript in `data/transcripts/`, extracts a journey per transcript, merges them into one journey map, and writes `data/output/journey.json`

