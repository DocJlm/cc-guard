<div align="center">

# cc-guard

**Real-time cost monitoring for Claude Code**

Stop guessing what Claude Code is costing you. See it live.

[![npm version](https://img.shields.io/npm/v/cc-guard.svg)](https://www.npmjs.com/package/cc-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)

```
npx cc-guard
```

</div>

---

```
 cc-guard v0.2.0                              API │ opus-4.6 │ ● Watching
──────────────────────────────────────────────────────────────────────────
 ┌──────── 💰 Cost ────────┐  ┌──────── 🔥 Burn Rate ─────┐
 │ Block      $15.04 / $50 │  │ Rate        $17.38/hr ↑    │
 │ Budget             30%  │  │ Recent      $22.10/hr (15m)│
 │ Total           $215.02 │  │ Projected   $87.02 / block │
 │ Calls              101  │  │ Trend ▁▂▃▃▅▅▆▇█▇ 0.2-3.1  │
 └─────────────────────────┘  └────────────────────────────┘

 ┌──────── ⏱ Block Timeline ───────────────────────────────┐
 │ ████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 30%  │
 │ Window              14:00 → 19:00                       │
 │ Remaining           3h 30m                              │
 └─────────────────────────────────────────────────────────┘

 ┌──── 📊 Token Breakdown ────┐  ┌──── 📋 Active Sessions ────┐
 │ opus-4.6            $15.04 │  │ my-project #a1b2c3d4       │
 │   Input   3.5K  Output 49… │  │   opus-4.6  $12.30  52c    │
 │   CW-5m      0  CW-1h  59… │  │ my-lib #e5f6a7b8           │
 │   CRead  3.9M              │  │   sonnet-4  $2.74   49c    │
 └─────────────────────────────┘  └────────────────────────────┘

 API  ● Watching  12 files  101 entries  Updated just now    Press q to quit
```

## Why cc-guard?

Claude Code is incredibly powerful — and incredibly easy to burn through money with. The **5-hour billing window** resets silently, your Opus calls cost **$25 per million output tokens**, and before you know it you've spent $50 in a single session.

Existing tools show you what you *already spent*. **cc-guard watches in real-time** and warns you *before* you blow your budget.

- **Zero config** — `npx cc-guard` and you're monitoring
- **Real-time** — live file watching, not post-hoc reports
- **Budget alerts** — yellow at 80%, red at 95%, before it's too late
- **Burn rate prediction** — see where your block is heading
- **Accurate pricing** — correct rates for Opus 4.5/4.6, Sonnet, Haiku (all variants)
- **Two billing modes** — API ($$) and Subscription (tokens)
- **Beautiful TUI** — responsive dashboard with sparklines and color-coded progress
- **Lightweight** — pure file watching, no proxy, no server, no API key needed

## Quick Start

```bash
# Just run it (no install needed)
npx cc-guard

# API mode with $20 budget per block
npx cc-guard --mode api --budget 20

# Subscription mode (show token usage instead of costs)
npx cc-guard --mode sub
```

Requires **Node.js 20+** and **Claude Code** (needs `~/.claude/projects/` logs).

## How It Works

Claude Code writes usage logs to `~/.claude/projects/**/*.jsonl`. cc-guard watches these files in real-time:

```
~/.claude/projects/**/*.jsonl
        ↓ chokidar (file watching)
    Parse JSONL lines
        ↓ requestId dedup (streaming chunks → final)
    Calculate costs (11 model pricing tiers)
        ↓ 5-hour billing block windowing
    Render live terminal dashboard (ink/React)
```

No API keys needed. No proxying. No code changes. It reads the same logs Claude Code already writes.

## Features

### Two Billing Modes

| | API Mode | Subscription Mode |
|---|---|---|
| Who | API key users | Pro/Max subscribers |
| Primary metric | **$ Cost** | **Token usage** |
| Budget alerts | Per-block $ budget | Hidden (no $ budget) |
| Burn rate | $/hr | tokens/hr |
| Auto-detect | `ANTHROPIC_API_KEY` exists | No API key |

Override with `--mode api` or `--mode sub`.

### Accurate Pricing for All Models

cc-guard ships with correct pricing for **11 Claude model variants**:

| Model | Input | Output | Cache Write (5m) | Cache Write (1h) | Cache Read |
|-------|-------|--------|-------------------|-------------------|------------|
| **Opus 4.5/4.6** | $5 | $25 | $6.25 | $10 | $0.50 |
| Opus 4.0/4.1/3 | $15 | $75 | $18.75 | $30 | $1.50 |
| Sonnet 4.5/4.0/3.7 | $3 | $15 | $3.75 | $6 | $0.30 |
| Haiku 4.5 | $1 | $5 | $1.25 | $2 | $0.10 |
| Haiku 3.5 | $0.80 | $4 | $1.00 | $1.60 | $0.08 |
| Haiku 3 | $0.25 | $1.25 | $0.30 | $0.50 | $0.03 |

*(prices per million tokens)*

**Two-layer cache**: Correctly distinguishes `ephemeral_5m` (1.25x) and `ephemeral_1h` (2x) cache pricing — most tools get this wrong.

**Unknown models** (e.g. `glm-4.7`): tokens are tracked, cost is shown as $0 with a warning badge.

### Cost & Budget Tracking
- Current block cost vs budget with percentage
- All-time total cost
- Color-coded progress bar (green → amber → red)
- Budget alerts at configurable thresholds

### Burn Rate Prediction
- Overall $/hr (or tok/hr in sub mode)
- 15-minute rolling average for recent activity
- Projected block total based on current rate
- Trend detection: rising ↑, falling ↓, stable →
- Color-coded sparkline chart with min/max

### 5-Hour Billing Blocks
- Visual progress bar with time remaining
- Automatic block boundary detection
- Multi-block history

### Session & Model Tracking
- Active sessions with project name + session ID
- Per-session cost/token breakdown
- Per-model token breakdown (input, output, cache write 5m/1h, cache read)
- Abbreviated model names for compact display

### Responsive UI
- **≥80 columns**: dual-column layout
- **<80 columns**: single-column stack
- Adaptive progress bar and sparkline width
- Color-coded everything: progress bars, sparklines, alerts, borders

## Installation

```bash
# Option 1: Run directly (always latest)
npx cc-guard

# Option 2: Install globally
npm install -g cc-guard
cc-guard

# Option 3: Project dependency
npm install cc-guard
npx cc-guard
```

## CLI Options

```
Usage: cc-guard [options]

Options:
  -V, --version            output the version number
  -b, --budget <amount>    Budget per 5-hour block in USD (default: 50)
  -m, --mode <mode>        Billing mode: api or sub (default: auto-detect)
  -d, --log-dir <path>     Custom Claude Code logs directory
  --warning <percent>      Warning threshold percentage (default: 80)
  --critical <percent>     Critical threshold percentage (default: 95)
  --no-alert               Disable budget alerts
  -h, --help               display help for command
```

### Examples

```bash
# Tight budget, early warning
cc-guard --budget 10 --warning 50 --critical 75

# Subscription user watching token usage
cc-guard --mode sub

# API user with custom log location
cc-guard --mode api --log-dir ~/custom-logs
```

## Configuration

Create `~/.cc-guard.json` for persistent settings:

```json
{
  "mode": "api",
  "budgetPerBlock": 30,
  "warningThreshold": 75,
  "criticalThreshold": 90,
  "refreshInterval": 1000,
  "panels": {
    "burnRate": true,
    "tokenBreakdown": true,
    "sessionList": true,
    "sparkline": true
  }
}
```

### Custom Model Pricing

New model launched? Third-party model? Add pricing without waiting for an npm update:

```json
{
  "customPricing": {
    "claude-new-model-5": {
      "input": 8,
      "output": 40,
      "cacheWrite5m": 10,
      "cacheWrite1h": 16,
      "cacheRead": 0.8
    },
    "glm-4.7": {
      "input": 1,
      "output": 4,
      "cacheWrite5m": 0,
      "cacheWrite1h": 0,
      "cacheRead": 0
    }
  }
}
```

Custom pricing takes priority over built-in pricing. Supports exact model ID match and substring match.

CLI flags always override config file values.

## Comparison

| Feature | cc-guard | ccusage | claude-tokenizer |
|---------|----------|---------|-----------------|
| Real-time monitoring | ✅ Live | ❌ Post-hoc | ❌ Post-hoc |
| Budget alerts | ✅ Warning + Critical | ❌ | ❌ |
| Burn rate prediction | ✅ + sparkline | Limited | ❌ |
| Two-layer cache pricing | ✅ 5m + 1h | ❌ | ❌ |
| API + Subscription modes | ✅ Both | ❌ API only | ❌ |
| Model coverage | 11 variants | ~3 | Varies |
| Custom model pricing | ✅ JSON config | ❌ | ❌ |
| Terminal UI | Rich dashboard | Table | Table |
| Setup | `npx cc-guard` | `npx ccusage` | Install required |
| Architecture | File watching | File reading | File reading |

## Architecture

```
src/
├── core/                  # Pure business logic (no React)
│   ├── cost-calculator.ts # Pricing table, model matching, cost calculation
│   ├── jsonl-parser.ts    # JSONL parsing with two-layer cache support
│   ├── billing-block.ts   # 5-hour window management
│   ├── burn-rate.ts       # Cost + token burn rate calculation
│   ├── log-discovery.ts   # Log file discovery
│   └── types.ts           # All TypeScript interfaces
├── hooks/                 # React hooks
│   ├── useLogWatcher.ts   # File watching + incremental parsing
│   ├── useBillingBlock.ts # Block computation
│   ├── useBurnRate.ts     # Dual burn rate (cost + tokens)
│   ├── useBudgetAlert.ts  # Alert threshold checking
│   ├── useTerminalSize.ts # Responsive layout
│   └── useConfig.ts       # Config loading
├── components/            # Ink UI components
│   ├── Dashboard.tsx      # Main layout (responsive)
│   ├── CostPanel.tsx      # Cost display (dual mode)
│   ├── BurnRatePanel.tsx  # Burn rate + sparkline (dual mode)
│   ├── BlockTimeline.tsx  # Progress bar + time
│   ├── TokenBreakdown.tsx # Per-model token details
│   ├── SessionList.tsx    # Active sessions
│   ├── AlertBanner.tsx    # Budget warning/critical
│   ├── ProgressBar.tsx    # Multi-color segmented bar
│   ├── Sparkline.tsx      # Per-char colored sparkline
│   └── StatusBar.tsx      # Mode badge + status
├── config/
│   ├── defaults.ts        # Default config + auto mode detection
│   └── loader.ts          # ~/.cc-guard.json loading
├── utils/
│   ├── format.ts          # Number/cost/token/model formatting
│   ├── colors.ts          # Color palette
│   └── platform.ts        # Cross-platform path handling
├── App.tsx                # Root component
└── index.tsx              # CLI entry point
```

## Development

```bash
git clone https://github.com/anthropics/cc-guard.git
cd cc-guard
npm install
npm run dev      # Watch mode build
npm test         # Run 78 tests
npm run build    # Production build
npm run typecheck # TypeScript check
```

### Tech Stack

- **[ink](https://github.com/vadimdemedes/ink)** v5 — React for terminal UIs
- **[chokidar](https://github.com/paulmillr/chokidar)** v4 — Cross-platform file watching
- **[commander](https://github.com/tj/commander.js)** — CLI argument parsing
- **[tsup](https://github.com/egoist/tsup)** — Fast TypeScript bundler
- **[vitest](https://vitest.dev/)** — Test runner

## FAQ

**Q: Does cc-guard need my API key?**
No. It reads Claude Code's local log files. No API key, no network access, no proxy.

**Q: Will it slow down Claude Code?**
No. It's a separate process that only reads files. Claude Code doesn't know it exists.

**Q: How does it handle streaming?**
Claude Code writes multiple log lines per request (streaming chunks) with the same `requestId`. cc-guard deduplicates them, keeping only the final entry with complete usage data.

**Q: What about the 5-hour billing window?**
cc-guard automatically detects billing block boundaries. When there's a gap > 5 hours or entries exceed the window, a new block starts. The progress bar shows where you are in the current block.

**Q: Why are my costs showing $0?**
The model is probably not in the built-in pricing table (e.g. a non-Anthropic model like `glm-4.7`). Add custom pricing in `~/.cc-guard.json` or check the status bar for "unknown models" count.

## License

MIT

---

<div align="center">

**Stop bleeding money. Start watching.**

```
npx cc-guard
```

</div>
