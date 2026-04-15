/**
 * Run context — generates unique IDs and holds shared runtime config.
 * Used by all pipeline stages to correlate outputs.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fromRoot } from './fs-utils';

dotenv.config();

/** Generates a short unique ID using timestamp + random suffix. */
export function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${ts}-${rand}`;
}

/** ISO timestamp string for the current moment. */
export function nowIso(): string {
  return new Date().toISOString();
}

/** Resolved paths for agent outputs, reports, and artifacts. */
export const Paths = {
  agentsOutput: fromRoot(process.env.AGENTS_OUTPUT_DIR ?? 'agents/output'),
  reports: fromRoot(process.env.REPORTS_DIR ?? 'reports'),
  artifacts: fromRoot(process.env.ARTIFACTS_DIR ?? 'artifacts'),
  testsGenerated: fromRoot(process.env.TESTS_GENERATED_DIR ?? 'tests/generated'),
  requirements: fromRoot('requirements', 'feature.md'),
  contracts: fromRoot('agents', 'contracts'),
  prompts: fromRoot('agents', 'prompts'),

  // Agent output files
  requirementAnalysis: () => path.join(Paths.agentsOutput, 'requirement-analysis.json'),
  testPlan: () => path.join(Paths.agentsOutput, 'test-plan.json'),
  generatedTestMetadata: () => path.join(Paths.agentsOutput, 'generated-test-metadata.json'),
  executionSummary: () => path.join(Paths.agentsOutput, 'execution-summary.json'),
  failureAnalysis: () => path.join(Paths.agentsOutput, 'failure-analysis.json'),
  healingAction: () => path.join(Paths.agentsOutput, 'healing-action.json'),
  validationReport: () => path.join(Paths.agentsOutput, 'validation-report.json'),
  finalQualityGate: () => path.join(Paths.agentsOutput, 'final-quality-gate.json'),
  finalSummary: () => path.join(Paths.reports, 'final-summary.md'),
};

/** Quality gate thresholds from environment. */
export const Thresholds = {
  pass: parseInt(process.env.PASS_THRESHOLD ?? '80', 10),
  warn: parseInt(process.env.WARN_THRESHOLD ?? '60', 10),
};

/** Run label for reports. */
export const RUN_LABEL = process.env.RUN_LABEL ?? 'local-run';
