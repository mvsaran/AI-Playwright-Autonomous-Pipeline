# 🤖 AI-Powered Autonomous Test Automation Pipeline

> A state-of-the-art, professional-grade test automation framework that utilizes **AI Agents** to transform raw requirements into executable, self-healing Playwright tests.

[![AI Autonomous Pipeline](https://img.shields.io/badge/Pipeline-Fully%20Autonomous-blueviolet?style=for-the-badge&logo=github-actions)](https://github.com/mvsaran/AI-Playwright-Autonomous-Pipeline/actions)
[![Playwright](https://img.shields.io/badge/Playwright-1.44-green?style=for-the-badge&logo=playwright)](https://playwright.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-orange?style=for-the-badge&logo=openai)](https://openai.com/)

---

## 🌟 Project Overview

This project implements an **Autonomous QA Lifecycle**. Unlike traditional frameworks where testers manually write and maintain scripts, this pipeline uses specialized AI agents to analyze requirements, plan scenarios, execute tests, diagnose failures, and **self-heal** code in real-time.

**Target Application:** [Automation Exercise](https://automationexercise.com) — a complex e-commerce demo site.

---

## 🏗️ Project Architecture: Layered Autonomous System

```text
┌─────────────────────────────────────────────────────────────┐
│          Layer 1: Application & Testing Environment         │
│  ┌──────────────┐                  ┌──────────────┐         │
│  │  Demo App    │◀────────────────▶│  Playwright  │         │
│  │  (AE Website)│                  │  E2E Suite   │         │
│  └──────────────┘                  └──────────────┘         │
└────────────────────┬────────────────────────────────────────┘
                     │ Test Failure
                     ▼
┌─────────────────────────────────────────────────────────────┐
│             Layer 2: Test Result Extraction                 │
│                 ┌──────────────────────┐                    │
│                 │   Playwright JSON    │                    │
│                 │   Failure Payload    │                    │
│                 └──────────────────────┘                    │
└────────────────────┬────────────────────────────────────────┘
                     │ Analyzes JSON
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Layer 3: AI Multi-Agent Orchestrator System         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Planner    │─▶│   Analyzer   │─▶│   Healer     │       │
│  │    Agent     │  │    Agent     │  │    Agent     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└────────────────────┬────────────────────────────────────────┘
                     │ Diagnosis & Policy
                     ▼
┌─────────────────────────────────────────────────────────────┐
│           Layer 4: CI/CD Resolution & Enforcement           │
│  ┌──────────────┐      ┌───────────────┐                    │
│  │ Automated MD │─────▶│ GitHub Actions │                    │
│  │   Summary    │      │ Quality Gate  │                    │
│  └──────────────┘      └───────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 The Complete Autonomous Workflow: Requirement to Result

This section details exactly how the system operates from the moment a requirement is added to the final HTML report.

### Step 1: Requirement Ingestion & Planning
*   **Input**: A plain text Markdown file (e.g., `requirements/cart.md`).
*   **The Brain (Planner Agent)**: The AI reads the English requirements and translates them into a **Test Plan (JSON)**. This plan includes specific user actions (Click, Type, Select) and expected validations (Assert URL, Assert Visibility).
*   **The Outcome**: A structured roadmap of "Test Scenarios" that the AI intends to build.

### Step 2: Zero-Code Test Generation & Locator Discovery
*   **The Brain (Generator Agent)**: The AI reads the Test Plan and our existing **Page Object Models (POMs)** in `pages/`. 
*   **No-Interaction Discovery**: The AI identifies locators by mapping the intended user action to the semantic constants in the POMs. For example, if the plan says "Click Login", the AI searches the `LoginPage` class for a locator like `loginButton`.
*   **Code Output**: The AI generates a full Playwright `.spec.ts` file. It automatically handles imports, test structure, and asynchronous flows.

### Step 3: Parallel Execution Strategy
*   **High-Speed Execution**: The pipeline uses Playwright's **Parallel Workers** (configurable in `playwright.config.ts`, currently set to 4).
*   **Isolation**: Multiple browser instances are launched simultaneously. This allows the system to run 20+ tests in under 2 minutes, even on slow-responding web applications.
*   **Stability**: The system uses elevated `navigationTimeout` (30s) and `actionTimeout` (10s) to ensure parallel load doesn't cause false failures.

### Step 4: The Failure-to-Healing Loop (Self-Correcting)
If a test fails (e.g., due to a UI change):
1.  **Extraction**: The system captures a screenshot, the failing line of code, and a JSON dump of the failure.
2.  **Analysis**: The **Failure-Analyzer** determines if it's a "Healable" issue.
3.  **Healing**: The **Self-Healer** reads the **Full Source File** and suggests a surgical code update (e.g., updating a timeout or a locator).
4.  **Verification**: The **Validator Agent** re-runs the specific failing test to confirm the fix works. If it passes, it updates the "Historical Memory".

### Step 5: CI/CD Quality Gate & HTML Dashboard
*   **The Decision**: The **Quality Gate Agent** evaluates the total run. It decides if the build is a "PASS" or "FAIL" based on whether 100% of failures were successfully healed.
*   **The Report**: A beautiful, premium HTML report is generated at `reports/autonomous-report.html`. It includes:
    *   **Success Metrics**: Pass rate, healing success rate, and run time.
    *   **AI Intelligence**: Detailed diffs of AI-generated fixes and failure analysis.
    *   **ROI Tracking**: Calculated cost savings of using AI vs. manual test maintenance.

---

### The Autonomous Loop

The pipeline operates in a closed-loop system where each stage feeds the next with structured JSON data:
1. **Analyze**: AI reads your `requirements/feature.md`.
2. **Plan**: AI creates the test scenarios.
3. **Execute**: Playwright runs the tests.
4. **Diagnose**: Failure Analyzer classifies the root cause.
5. **Heal**: Self-Healer modifies code for locator/timing fixes.
6. **Gate**: Quality Gate makes the Go/No-Go decision.

### 1. Requirements & Planning
- **Requirement Analyzer**: Digests raw Markdown requirements and identifies modules, user journeys, edge cases, and priorities.
- **Test Planner**: Converts analysis into a structured test plan with concrete IDs (TC-AUTH-001) and step-by-step logic.

### 2. Execution & Intelligence
- **Execution Script**: Orchestrates Playwright across multiple spec files, capturing screenshots/traces and detailed JSON reports.
- **Failure Analyzer**: If a test fails, this agent classifies it into 7 categories (e.g., `locator_issue`, `probable_app_bug`, `timing_issue`).

### 3. Self-Healing & Validation
- **Self-Healer**: If it identifies a `locator_issue` with high confidence, it **modifies the source code** automatically to fix the selector.
- **Validator**: Re-runs only the "healed" tests to prove the fix worked.

### 4. Continuous Decision Making
- **Quality Gate**: Gathers all data (including probable app bugs discovered) and makes a final Go/No-Go decision based on configured pass thresholds.

---

## 📁 Folder Structure Explained

| Directory | Purpose |
|:---|:---|
| **`.github/workflows`** | Contains `autonomous-pipeline.yml` for GitHub Actions automation. |
| **`agents/`** | The "Brain" of the framework. Contains agent logic, OpenAI system prompts, and output JSONs. |
| **`agents/contracts`** | Strict JSON Schemas ensuring 100% reliable data transfer between AI agents. |
| **`pages/`** | Page Object Models (POMs) with centralized selector constants for easy maintenance. |
| **`requirements/`** | The single source of truth. Change `feature.md` and the pipeline adapts. |
| **`scripts/`** | Runtime orchestration (Bootstrap, execute-tests, pipeline). |
| **`tests/generated`** | The execution layer. House the `.spec.ts` files that the AI interacts with. |
| **`utils/`** | Shared utilities for File System, Logging, and OpenAI client management. |

---

## 🛠 Prerequisites & Installation

Before implementing, ensure you have:
1. **Node.js**: Version 18 or higher.
2. **OpenAI API Key**: A valid key with access to GPT-4o.
3. **GitHub Account**: To host and run the Actions.

### Setup Steps:
```bash
# 1. Clone
git clone https://github.com/mvsaran/AI-Playwright-Autonomous-Pipeline.git
cd AI-Playwright-Autonomous-Pipeline

# 2. Install
npm install

# 3. Setup Environment
npm run ai:bootstrap
# Open .env and add your OPENAI_API_KEY
```

---

## ⚙️ How to Implement & Trigger
### Local Execution:
Run the entire loop from your terminal:
```bash
npm run ai:pipeline
```
### 🛠 Manual Agent Control (Step-by-Step)
If you want to run specific agents manually:
```bash
npm run ai:execute           # 1. Run Playwright Tests
npm run ai:analyze-failures  # 2. Diagnose Failures (if any)
npm run ai:heal              # 3. Apply AI Self-Healing
npm run ai:validate          # 4. Verify Healed Tests
npm run ai:report            # 5. Generate Dashboard
```

### 🎯 Proving Self-Healing (The Demo Case)
To see the system in action:
1.  **Break a Locator**: Deliberately change a selector in `tests/generated/auth.spec.ts` (e.g., change `login-button` to `broken-locator`).
2.  **Run Pipeline**: Execute `npm run ai:pipeline`.
3.  **Result**: 
    *   **Phase 4** will report a failure.
    *   **Phase 5** will analyze it as a `locator_issue`.
    *   **Phase 6 (Healer)** will automatically patch the code back to the original selector.
    *   **Report**: The final `autonomous-report.html` will show **"STABILITY ENHANCED (Healed)"** status.



### GitHub Actions (The "Fully Autonomous" Part):
1. **Add Secrets**: Go to your GitHub Repo Settings → Secrets → Actions. Add `OPENAI_API_KEY`.
2. **Push to Main**: Any push to `main` triggers a full run.
3. **Manual Trigger**: Go to **Actions** tab → **AI Playwright Autonomous Pipeline** → **Run workflow**.

---

## 💎 Key Benefits of this Pipeline

1. **Zero-Touch Maintenance**: Most element changes (selectors) are fixed by the Self-Healer without human dev time.
2. **Traceability**: Every test case links back to a requirement journey ID in the JSON artifacts.
3. **High Confidence Releases**: The Quality Gate analyzes the *nature* of failures, separating "flaky tests" from "real app bugs."
4. **Portfolio Ready**: Demonstrates advanced knowledge of AI prompting, Playwright POMs, and CI/CD orchestration.

---

## 🛡️ Safety & Guardrails
- **Healer Backups**: Every time a file is healed, a `.backup` version is created.
- **Assertion Integrity**: The AI is forbidden from changing `expect()` values to hide bugs.
- **Fail-Fast**: If the Quality Gate fails (e.g., < 80% pass), the GitHub Job fails, preventing bad releases.

---

## 📄 License
MIT — Created by **Saran** for AI-Driven QA Excellence.
