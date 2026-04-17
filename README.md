# Frameflow

Frameflow reproduces high-end reference websites into Framer-ready structures, code components, overrides, and deployment-ready repositories. You point it at a URL (or screenshots/video), and it outputs a full set of design tokens, section components, motion decisions, and a placements manifest ready to insert into your Framer canvas.

---

## Repository layout

```
frameflow/
├── orchestrator/           # Node.js pipeline — scripts, schemas, outputs
│   ├── config/             # providers.json — Claude subscription or Hugging Face
│   ├── input/              # reference-request.json written by the plugin or manually
│   ├── output/             # site-map.json, design-tokens.json, motion-map.json, qa-report.md
│   ├── prompts/            # Markdown prompt templates for each pipeline stage
│   ├── schemas/            # JSON Schema definitions for site-map and motion-map
│   └── scripts/            # Every orchestration script (see Pipeline scripts below)
├── framer/
│   ├── code-components/    # Standalone Framer code components (PremiumCursorGlow, TokenCard…)
│   ├── overrides/          # Framer overrides (withCursorParallax, withMagneticHover)
│   ├── custom-code/        # site-head.html / site-body-end.html for Framer custom code
│   └── generated/          # ALL generated output — do not edit by hand
│       ├── sections/       # Generated section TSX files + _manifest.json
│       ├── motion/         # motion-decisions.generated.json, override-manifest, gsap-manifest
│       ├── gsap/           # Generated GSAP animation components
│       ├── placements.json # Placements manifest (see below)
│       └── tokens.generated.*  # Design tokens as JSON and TypeScript
├── plugin-frameflow/       # The Framer plugin (production version, framer-plugin CLI)
│   └── src/
│       ├── main.tsx        # Full plugin UI — request form, receiver status, placement panel
│       └── bridge.ts       # All fetch calls to the local receiver (typed)
├── plugin/                 # Vite-based plugin scaffold (development/testing)
├── design-system/          # Token, component, motion, and accessibility design docs
└── docs/                   # Build summaries, QA reports, motion build reports
```

---

## How it works

### 1. Plugin — form a request

Open the `plugin-frameflow` inside Framer. The plugin UI lets you set:

| Field | Options |
|---|---|
| Reference URL | Any public URL, e.g. `https://waaark.com/` |
| Reference style | `agency` · `editorial` · `product` |
| Build mode | `analysis` · `scaffold` · `full` |
| Provider | `claude-subscription` · `huggingface-free` |
| Cheap model | Prefer a lighter model when the provider supports it |
| Notes | Micro-interactions, scroll behavior, cursor intent, asset rules |

The plugin shows a live **Receiver** status badge that polls `http://127.0.0.1:4317/status` every 3 seconds.

### 2. Local receiver — bridge between Framer and the pipeline

The local receiver is a lightweight HTTP server (`orchestrator/scripts/local-receiver.mjs`) that runs on your machine at `http://127.0.0.1:4317`. It:

- Accepts `POST /request` — writes the payload to `orchestrator/input/reference-request.json` and launches the pipeline
- Exposes `GET /status` — pipeline state (`idle` · `queued` · `running` · `success` · `failed`)
- Exposes `GET /artifacts` — generated sections list, motion decisions, and report paths
- Exposes `GET /placements` — enriched placements manifest with readiness states
- Exposes `GET /read?file=<path>` — serves generated files back to the plugin for source preview (sandboxed to `docs/`, `framer/generated/`, `framer/code-components/`, `orchestrator/output/`)

If a pipeline run is already in progress when a new request arrives, the receiver sets state to `queued` and responds `202`.

### 3. Pipeline — generate everything

`npm run launch:frameflow` runs these steps in sequence:

1. **Select provider** — reads `orchestrator/config/providers.json`, validates the active provider
2. **Check provider safety** — verifies credentials/environment are correct for the chosen provider
3. **Route provider tasks** — applies provider-specific routing and model selection
4. **Pick site map** — writes `orchestrator/output/active-site-map.json` for the run
5. **Generate placements manifest** — scans `framer/generated/sections/` and writes `framer/generated/placements.json`
6. **Run full pipeline** — reads the active map and runs the matching pipeline (`pipeline:agency`, `pipeline:editorial`, or `pipeline:product`)

Each full pipeline runs: `build:tokens` → `build:site` → `build:motion` → `build:motion-files` → `build:summary`

### 4. Placements manifest

`framer/generated/placements.json` is the contract between the pipeline and the plugin. It is generated from `framer/generated/sections/_manifest.json` (or by scanning the directory directly) and enriched with inferred metadata:

| Field | Description |
|---|---|
| `id` | File stem of the generated section, e.g. `HomeHeroSection` |
| `name` | Human-readable title |
| `moduleUrl` | Framer module URL — must be set before a section can be inserted |
| `category` | Inferred from the filename: `hero` · `showcase` · `feature` · `testimonial` · `footer` · `header` · `section` |
| `width` / `height` | Default canvas dimensions inferred from category |
| `sourceFile` | Relative path to the generated TSX file |
| `importHint` | Plain-English instruction for where to place the component in Framer |
| `fileSize` | Bytes of the generated source file |
| `updatedAt` | Last-modified timestamp |

### 5. Readiness states

Every placement in the manifest is evaluated against two conditions — does the generated file exist on disk, and does it have a valid Framer module URL?

| State | Label | Meaning |
|---|---|---|
| `ready` | Ready to insert | Generated file exists **and** `moduleUrl` is a valid `https://framer.com/m/…` URL |
| `generated-not-imported` | Generated but not imported | Generated file exists but `moduleUrl` is empty or a placeholder |
| `missing-module-url` | Missing module URL | `moduleUrl` is valid but the generated file is missing on disk |
| `missing-generated-file` | Missing generated file | Neither file nor URL is present |

The plugin renders each state with a distinct colour badge and groups placements by readiness. Only placements in `ready` state enable the **Insert** button, which calls `framer.addComponentInstance()` with the section's `moduleUrl` and dimensions.

---

## Providers

| Provider key | Type | Auth |
|---|---|---|
| `claude-subscription` | Claude Code (Pro/Max login) | No API key — keep `ANTHROPIC_API_KEY` unset |
| `huggingface-free` | Hugging Face routed inference | Set `HF_TOKEN` in your environment |

The default provider is `claude-subscription`. Switch via the plugin dropdown or edit `orchestrator/config/providers.json`.

---

## Running the project

### Prerequisites

- Node.js 20+
- Framer desktop app with **Plugin development** enabled
- (Optional) Hugging Face token in `HF_TOKEN` if using the `huggingface-free` provider

### Step 1 — Install dependencies

```bash
# Root workspace
npm install

# Framer plugin
cd plugin-frameflow && npm install
```

### Step 2 — Start the local receiver

```bash
npm run receiver:frameflow
# Frameflow local receiver running at http://127.0.0.1:4317
```

Keep this terminal running. The pipeline writes its outputs here and the plugin polls this address.

### Step 3 — Load the plugin in Framer

1. Open Framer desktop.
2. Go to **Plugins → Development → Load Plugin**.
3. Point it at `plugin-frameflow/` and click **Load**.

For the Vite-based development scaffold instead:

```bash
cd plugin && npm install && npm run dev
# then load http://localhost:5173 as a plugin in Framer
```

### Step 4 — Send a request

1. Fill in the Reference URL and any notes in the plugin panel.
2. Click **Send to local pipeline**.
3. The Receiver badge will transition: `idle → running → success`.
4. Once complete, the **Generated artifacts** and **Canvas insertion** panels appear.

### Step 5 — Insert sections onto the canvas

1. In the **Canvas insertion** panel, set the `moduleUrl` field in `framer/generated/placements.json` for each section after publishing it to Framer as a component.
2. Re-run `npm run placements:generate` to refresh readiness.
3. Placements marked **Ready to insert** will have an active **Insert** button.

### Running pipeline stages individually

```bash
npm run build:tokens          # orchestrator/output/design-tokens.json → framer/generated/tokens.*
npm run build:site            # build site map for the active reference style
npm run build:motion          # generate motion decisions
npm run build:motion-files    # generate GSAP and override files
npm run build:summary         # write docs/build-summary.md
npm run placements:generate   # refresh framer/generated/placements.json
npm run launch:frameflow      # run the full launch sequence (provider → pipeline)
```

Pre-built pipeline shortcuts:

```bash
npm run pipeline:agency
npm run pipeline:editorial
npm run pipeline:product
```

---

## Required outputs

After a full pipeline run, these files must exist:

| Path | Description |
|---|---|
| `orchestrator/output/site-map.json` | Full page and section structure |
| `orchestrator/output/design-tokens.json` | Color, type, spacing, radius, and motion tokens |
| `orchestrator/output/motion-map.json` | Per-interaction motion classification and implementation decisions |
| `docs/qa-report.md` | QA checklist result against desktop and mobile breakpoints |

---

## Motion classification

| Class | Used for |
|---|---|
| `load` | Entry animations triggered on page/section load |
| `hover` | Cursor-over state changes |
| `scroll` | Scroll-driven transformations |
| `cursor` | Custom cursor behaviors and parallax |
| `transition` | Page and route transitions |
| `svg-path` | Path draw / morph animations |

GSAP is used only when Framer-native motion is not sufficient. Every advanced interaction must include a reduced-motion fallback.

---

## Code standards

- React 18 compatible only.
- TypeScript for all code components and overrides.
- One interaction family per component where possible.
- Structure first, motion second, polish last.
- Do not mix generated output with experimental scratch files.
