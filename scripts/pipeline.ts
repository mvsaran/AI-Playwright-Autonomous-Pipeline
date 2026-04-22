/**
 * Pipeline Orchestrator
 * Runs all AI agents and scripts in sequence:
 *   Prepare → Analyze → Plan → Generate → Execute → Analyze Failures
 *   → Self-Heal → Validate → Quality Gate
 *
 * Run with: npm run ai:pipeline
 */
import { spawnSync, SpawnSyncReturns } from 'child_process';
import { logger } from '../utils/logger';
import { fileExists } from '../utils/fs-utils';
import { Paths } from '../utils/run-context';

const CONTEXT = 'Pipeline';

interface PipelineStep {
  name: string;
  script: string;
  /** If true, pipeline stops on non-zero exit */
  failFast: boolean;
  /** Skip this step if a required input file is missing */
  requiresFile?: string;
}

const STEPS: PipelineStep[] = [
  {
    name: '0 — Prepare Folders',
    script: 'scripts/prepare-folders.ts',
    failFast: true,
  },
  {
    name: '1 — Requirement Analyzer',
    script: 'agents/requirement-analyzer.ts',
    failFast: true,
  },
  {
    name: '2 — Test Planner',
    script: 'agents/test-planner.ts',
    failFast: true,
    requiresFile: Paths.requirementAnalysis(),
  },
  {
    name: '3 — Test Generator',
    script: 'agents/test-generator.ts',
    failFast: false,
    requiresFile: Paths.testPlan(),
  },
  {
    name: '4 — Execute Tests',
    script: 'scripts/execute-tests.ts',
    failFast: false,
  },
  {
    name: '5 — Failure Analyzer',
    script: 'agents/failure-analyzer.ts',
    failFast: false,
    requiresFile: Paths.executionSummary(),
  },
  {
    name: '6 — Self-Healer',
    script: 'agents/self-healer.ts',
    failFast: false,
    requiresFile: Paths.failureAnalysis(),
  },
  {
    name: '7 — Validator',
    script: 'agents/validator.ts',
    failFast: false,
    requiresFile: Paths.healingAction(),
  },
  {
    name: '8 — Quality Gate',
    script: 'agents/quality-gate.ts',
    failFast: true,
    requiresFile: Paths.validationReport(),
  },
  {
    name: '9 — Generate HTML Report',
    script: 'scripts/generate-html-report.ts',
    failFast: false,
    requiresFile: Paths.finalQualityGate(),
  },
];

function runStep(step: PipelineStep): boolean {
  logger.separator(`STEP: ${step.name}`);

  if (step.requiresFile && !fileExists(step.requiresFile)) {
    logger.warn(CONTEXT, `Required input not found: ${step.requiresFile}`);
    logger.warn(CONTEXT, `Skipping step: ${step.name}`);
    return true; // Non-fatal skip
  }

  const result: SpawnSyncReturns<string> = spawnSync(
    'npx',
    ['tsx', step.script],
    {
      encoding: 'utf-8',
      shell: true,
      stdio: 'inherit',
      env: { ...process.env },
    }
  );

  if (result.status !== 0) {
    logger.error(CONTEXT, `Step "${step.name}" exited with code ${result.status}`);
    return false;
  }

  logger.success(CONTEXT, `Step "${step.name}" completed successfully.`);
  return true;
}

async function runPipeline(): Promise<void> {
  logger.separator('AI PLAYWRIGHT AUTONOMOUS PIPELINE');
  logger.info(CONTEXT, `Target: ${process.env.BASE_URL ?? 'https://automationexercise.com'}`);
  logger.info(CONTEXT, `Run Label: ${process.env.RUN_LABEL ?? 'local-run'}`);
  logger.info(CONTEXT, `Steps: ${STEPS.length}`);

  const startTime = Date.now();
  let pipelineFailed = false;

  for (const step of STEPS) {
    const success = runStep(step);

    if (!success && step.failFast) {
      logger.error(CONTEXT, `Pipeline halted at step: ${step.name}`);
      pipelineFailed = true;
      break;
    }

    if (!success) {
      logger.warn(CONTEXT, `Step "${step.name}" failed but pipeline continues (failFast=false).`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logger.separator('PIPELINE COMPLETE');
  logger.info(CONTEXT, `Total duration: ${elapsed}s`);

  if (pipelineFailed) {
    logger.error(CONTEXT, 'Pipeline FAILED — check logs above.');
    process.exit(1);
  }

  // Check quality gate file for final status
  if (fileExists(Paths.finalQualityGate())) {
    try {
      const { readJson } = await import('../utils/json-utils');
      const gate = readJson<{ pipelineStatus: string }>(Paths.finalQualityGate());
      logger.info(CONTEXT, `Final Quality Gate: ${gate.pipelineStatus}`);

      if (gate.pipelineStatus === 'FAIL') {
        logger.error(CONTEXT, 'Quality gate FAILED — pipeline exits with error.');
        process.exit(1);
      }
    } catch {
      logger.warn(CONTEXT, 'Could not read final quality gate JSON.');
    }
  }

  // Final Historical Summary
  try {
    const { getProjectSummary } = await import('../utils/db-utils');
    const projectSummary = getProjectSummary();
    if (projectSummary) {
      logger.separator('PROJECT HISTORICAL SUMMARY');
      logger.info(CONTEXT, `Total Runs: ${projectSummary.totalRuns}`);
      logger.info(CONTEXT, `Avg Pass Rate: ${projectSummary.avgPassRate}%`);
      logger.info(CONTEXT, `Total Tests Healed: ${projectSummary.totalHealed}`);
      logger.success(CONTEXT, `Total Automation Cost (ROI): $${projectSummary.totalCost}`);
    }
  } catch (err) {
    logger.warn(CONTEXT, 'Could not load historical summary.');
  }

  logger.success(CONTEXT, 'Pipeline PASSED successfully.');
}


runPipeline().catch((err) => {
  logger.error(CONTEXT, 'Unexpected pipeline error.', err);
  process.exit(1);
});
