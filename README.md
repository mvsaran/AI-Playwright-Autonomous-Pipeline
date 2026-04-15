# AI Playwright Autonomous Pipeline

> A portfolio-grade, end-to-end AI-driven test automation pipeline built with **Node.js**, **TypeScript**, **Playwright**, and **OpenAI GPT-4o**.

**Target Application:** [https://automationexercise.com](https://automationexercise.com)

---

## Pipeline Flow

```
Requirement → Analyze → Plan → Generate Tests → Execute
     → Analyze Failures → Self-Heal → Re-run → Validate
          → Quality Gate → Publish Report
```

Each stage is powered by a dedicated AI agent that reads a structured JSON input and writes a structured JSON output — creating a fully traceable, autonomous QA pipeline.

---

## Project Structure

```
ai-playwright-autonomous-pipeline/
├── .github/workflows/          # GitHub Actions CI/CD
├── agents/
│   ├── contracts/              # JSON schemas for all agent I/O
│   ├── output/                 # Runtime agent JSON outputs
│   ├── prompts/                # LLM system prompts (one per agent)
│   ├── requirement-analyzer.ts
│   ├── test-planner.ts
│   ├── test-generator.ts
│   ├── failure-analyzer.ts
│   ├── self-healer.ts
│   ├── validator.ts
│   └── quality-gate.ts
├── pages/                      # Playwright Page Object Models
│   ├── BasePage.ts
│   ├── HomePage.ts
│   ├── LoginPage.ts
│   ├── ProductsPage.ts
│   ├── CartPage.ts
│   └── ContactPage.ts
├── requirements/
│   └── feature.md              # Human-readable feature requirements
├── scripts/
│   ├── pipeline.ts             # Main orchestrator
│   ├── execute-tests.ts        # Playwright test runner wrapper
│   ├── bootstrap.ts            # First-run setup
│   └── prepare-folders.ts      # Directory scaffolding
├── tests/
│   └── generated/              # Test spec files
│       ├── auth.spec.ts
│       ├── products.spec.ts
│       ├── cart.spec.ts
│       └── contact.spec.ts
├── types/                      # Shared TypeScript types
├── utils/                      # Shared utilities
├── reports/                    # Human-readable outputs
├── artifacts/                  # Screenshots, traces, videos
├── .env.example
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-playwright-autonomous-pipeline
npm install
npx playwright install chromium
```

### 2. Configure environment

```bash
# Bootstrap creates .env from .env.example
npm run ai:bootstrap
```

Open `.env` and set:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o
BASE_URL=https://automationexercise.com
```

### 3. Run the full pipeline

```bash
npm run ai:pipeline
```

This runs all 9 steps automatically:

| Step | Script | Description |
|---|---|---|
| 0 | `prepare-folders` | Creates required output dirs |
| 1 | `ai:analyze` | Reads `feature.md` → produces `requirement-analysis.json` |
| 2 | `ai:plan` | Reads analysis → produces `test-plan.json` |
| 3 | `ai:generate` | Reads plan → maps to test files, writes metadata |
| 4 | `ai:execute` | Runs Playwright tests → writes `execution-summary.json` |
| 5 | `ai:analyze-failures` | Classifies failures → writes `failure-analysis.json` |
| 6 | `ai:heal` | Applies safe fixes → writes `healing-action.json` |
| 7 | `ai:validate` | Re-runs healed tests → writes `validation-report.json` |
| 8 | `ai:quality-gate` | Makes go/no-go decision → writes `final-quality-gate.json` + `final-summary.md` |

### 4. Run steps individually

```bash
npm run ai:analyze          # Requirement analysis only
npm run ai:plan             # Test planning only
npm run ai:generate         # Test generation metadata only
npm run ai:execute          # Run Playwright tests only
npm run ai:analyze-failures # Failure analysis only
npm run ai:heal             # Self-healing only
npm run ai:validate         # Validation only
npm run ai:quality-gate     # Quality gate only
```

### 5. Run tests directly (without AI pipeline)

```bash
npm test                          # All tests
npm run test:generated            # Generated tests only
npx playwright test --ui          # Playwright UI mode
npx playwright show-report        # Open HTML report
```

---

## Agent Descriptions

### 🔍 Requirement Analyzer
Reads `requirements/feature.md` and produces a structured analysis with user journeys, edge cases, negative scenarios, risks, and a confidence score.

**Output:** `agents/output/requirement-analysis.json`

### 📋 Test Planner
Converts the requirement analysis into a detailed test plan with scenario IDs, priorities, modules, test types, steps, and expected outcomes.

**Output:** `agents/output/test-plan.json`

### 🏗️ Test Generator
Maps the test plan to generated spec files and writes metadata tracking which file covers which scenarios.

**Output:** `agents/output/generated-test-metadata.json`

### ▶️ Execution Agent
Runs Playwright tests via `spawnSync`, parses the JSON report, and captures pass/fail/skip counts and failure details.

**Output:** `agents/output/execution-summary.json`

### 🔬 Failure Analyzer
Classifies each test failure into one of 7 typed categories with a confidence score and healing recommendation.

**Failure Types:**
- `locator_issue` — Selector outdated or wrong
- `timing_issue` — Race condition or slow load
- `assertion_issue` — Wrong expected value
- `data_issue` — Test data problem
- `environment_issue` — Network or config error
- `flaky` — Intermittent failure
- `probable_app_bug` — Application is broken

**Output:** `agents/output/failure-analysis.json`

### 🔧 Self-Healer
Applies safe, targeted fixes to test files based on failure analysis. Enforces strict guardrails.

**Guardrails:**
- Only heals `locator_issue` and `timing_issue`
- Never heals `probable_app_bug`
- Skips any fix with confidence < 0.7
- Always backs up original file first
- Maximum 1 healing pass

**Output:** `agents/output/healing-action.json`

### ✅ Validator
Re-runs healed test files and compares results to determine whether healing was effective (`IMPROVED` / `SAME` / `REGRESSED`).

**Output:** `agents/output/validation-report.json`

### 🚦 Quality Gate
Makes the final go/no-go decision based on all pipeline data.

**Gate Values:**
- `PASS` — passRate ≥ 80% with no blockers
- `PASS_WITH_WARNINGS` — passRate ≥ 60% or warnings present
- `FAIL` — passRate < 60% or critical blockers

**Output:** `agents/output/final-quality-gate.json` + `reports/final-summary.md`

---

## Test Coverage

| Module | # Tests | Types |
|---|---|---|
| Authentication | 7 | smoke, regression, negative |
| Products | 7 | smoke, regression, edge, negative |
| Cart | 5 | smoke, regression, edge |
| Contact | 4 | smoke, regression, edge |

**Total: 23 test cases** covering:
- Home page load and navigation
- Signup and new user registration
- Valid and invalid login
- Logout flow
- Product listing and detail page
- Product search (normal, uppercase, empty)
- Add to cart, cart verification
- Contact form submission

---

## JSON Contracts

Each agent communicates via strict JSON schemas:

| File | Purpose |
|---|---|
| `requirement-analysis.schema.json` | Requirement analysis output |
| `test-plan.schema.json` | Test plan with scenarios |
| `generated-test-metadata.schema.json` | Generated file tracking |
| `execution-summary.schema.json` | Test execution results |
| `failure-analysis.schema.json` | Failure classification |
| `healing-action.schema.json` | Self-healing actions |
| `validation-report.schema.json` | Post-healing results |
| `final-quality-gate.schema.json` | Final pipeline decision |

---

## GitHub Actions

The pipeline runs automatically on:
- **Push** to `main` or `develop`
- **Pull Requests** to `main`
- **Manual dispatch** (`workflow_dispatch`) with an optional run label

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `OPENAI_API_KEY` | Your OpenAI API key |

### Optional GitHub Variables

| Variable | Default | Description |
|---|---|---|
| `OPENAI_MODEL` | `gpt-4o` | OpenAI model to use |

### Artifacts Uploaded

- `playwright-report` — Full HTML Playwright report
- `agent-outputs` — All agent JSON files
- `final-summary` — Human-readable markdown report
- `test-artifacts` — Screenshots, traces, videos

---

## Page Objects

All UI selectors are **centralized in selector constant objects** at the top of each page object file. If automationexercise.com updates its UI, you only need to update one location per page.

| File | Responsibility |
|---|---|
| `BasePage.ts` | Shared navigation, dismissAd, waitForUrl |
| `HomePage.ts` | Home page load, nav links |
| `LoginPage.ts` | Login, signup, registration, logout |
| `ProductsPage.ts` | Browse, search, detail, add to cart |
| `CartPage.ts` | View cart, item verification, checkout |
| `ContactPage.ts` | Form fill, JS alert handling, success |

---

## Configuration

All configuration is via environment variables:

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | **Required.** OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o` | Model name |
| `OPENAI_MAX_TOKENS` | `4096` | Max tokens per call |
| `OPENAI_TEMPERATURE` | `0.2` | AI temperature |
| `BASE_URL` | `https://automationexercise.com` | Target app URL |
| `HEADLESS` | `true` | Playwright headless mode |
| `PASS_THRESHOLD` | `80` | Minimum % to PASS |
| `WARN_THRESHOLD` | `60` | Minimum % to PASS_WITH_WARNINGS |
| `RUN_LABEL` | `local-run` | Label shown in reports |

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥18 | Runtime |
| TypeScript | ^5.4 | Language |
| Playwright | ^1.44 | Browser automation |
| OpenAI SDK | ^4.47 | AI agents |
| tsx | ^4.11 | TypeScript execution |
| dotenv | ^16 | Environment config |

---

## Self-Healing Philosophy

> The healer fixes the **test**, never the **truth**.

The pipeline will never:
- Replace a meaningful assertion with a weaker one to force a pass
- Skip a test to hide a real failure
- Suppress a probable application bug
- Apply a fix with low confidence (< 0.7)

The pipeline will:
- Back up the original file before any change
- Apply one precise, targeted fix per failure
- Log exactly what changed and why
- Re-run to verify the fix actually worked

---

## Reports

After each pipeline run:

- **`reports/final-summary.md`** — Human-readable pipeline report
- **`playwright-report/index.html`** — Full Playwright HTML report
- **`agents/output/*.json`** — All agent outputs (machine-readable)

---

## License

MIT — free to use, fork, and adapt for your portfolio or projects.
