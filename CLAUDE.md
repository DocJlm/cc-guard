# cc-guard

## Project overview
Real-time cost monitoring dashboard for Claude Code. Watches `~/.claude/projects/**/*.jsonl` logs and displays a live terminal UI with cost tracking, burn rate, and budget alerts. Supports both API (pay-per-token) and subscription billing modes.

## Tech stack
- TypeScript, Node.js 20+
- ink v5 (React-based terminal UI)
- chokidar v4 (file watching)
- commander (CLI args)
- tsup (bundler)
- vitest (tests)

## Key commands
- `npm run build` — Build with tsup
- `npm test` — Run vitest tests (78 tests)
- `npm run dev` — Watch mode build
- `npm start` — Run built output
- `npm run typecheck` — TypeScript type check

## Architecture
- `src/core/` — Pure logic (no React): JSONL parsing, billing blocks, burn rate, cost calculator
- `src/hooks/` — React hooks: file watching, state derivation, terminal size
- `src/components/` — Ink UI components (responsive layout)
- `src/config/` — Configuration loading from `~/.cc-guard.json`
- `src/utils/` — Formatting, colors, platform helpers

## Key concepts
- **Billing Mode**: `api` (pay-per-token, shows $) or `sub` (subscription, shows tokens). Auto-detected from `ANTHROPIC_API_KEY` env var. Override with `--mode api|sub`.
- **Billing Block**: 5-hour window starting at floored UTC hour. New block starts when gap > 5h or entry exceeds window.
- **Burn Rate**: `blockCost / elapsedHours` (api) or `blockTokens / elapsedHours` (sub). Trend compares 15-min recent rate vs overall rate.
- **Budget Alert**: Default $50/block. Warning at 80%, critical at 95%. Hidden in sub mode.
- **Model Pricing**: Full pricing table for Opus/Sonnet/Haiku families with two-layer cache (ephemeral_5m, ephemeral_1h). Unknown models get cost=0 but tokens are tracked.
- **Custom Pricing**: Users can add custom model pricing in `~/.cc-guard.json` under `customPricing`.
