/**
 * Execute Tests Script
 * Runs Playwright tests and captures results into execution-summary.json
 */
import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { writeJson, readJson } from '../utils/json-utils';
import { ensureDir } from '../utils/fs-utils';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import type { ExecutionSummary, FailedTest } from '../types/execution';

const CONTEXT = 'ExecuteTests';

interface PlaywrightJsonResult {
  stats?: {
    expected?: number;
    unexpected?: number;
    skipped?: number;
    duration?: number;
  };
  suites?: PlaywrightSuite[];
}

interface PlaywrightSuite {
  title?: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightSpec {
  title?: string;
  ok?: boolean;
  tests?: PlaywrightTest[];
  file?: string;
}

interface PlaywrightTest {
  results?: PlaywrightTestResult[];
}

interface PlaywrightTestResult {
  status?: string;
  error?: { message?: string };
  attachments?: Array<{ name: string; path?: string }>;
}

function collectFailures(
  suites: PlaywrightSuite[],
  failures: FailedTest[],
  filePath = ''
): void {
  for (const suite of suites) {
    const currentFile = filePath || suite.title || '';
    if (suite.suites) {
      collectFailures(suite.suites, failures, currentFile);
    }
    for (const spec of suite.specs ?? []) {
      if (!spec.ok) {
        const result = spec.tests?.[0]?.results?.[0];
        const errorMsg = result?.error?.message ?? 'Unknown error';
        const screenshot = result?.attachments?.find((a) => a.name === 'screenshot')?.path;
        const trace = result?.attachments?.find((a) => a.name === 'trace')?.path;

        failures.push({
          testId: `${currentFile}::${spec.title ?? 'unknown'}`,
          title: spec.title ?? 'unknown',
          errorMessage: errorMsg.slice(0, 500), // Truncate very long messages
          filePath: currentFile,
          screenshotPath: screenshot,
          tracePath: trace,
        });
      }
    }
  }
}

async function execute(): Promise<void> {
  logger.separator('EXECUTE TESTS');

  ensureDir(Paths.agentsOutput);
  ensureDir(Paths.reports);
  ensureDir(Paths.artifacts);

  const reportJsonPath = path.join(Paths.reports, 'playwright-results.json');
  const startTime = Date.now();

  logger.info(CONTEXT, 'Running Playwright tests (tests/generated/)...');

  const result = spawnSync(
    'npx',
    ['playwright', 'test', 'tests/generated/', '--reporter=json,list'],
    {
      encoding: 'utf-8',
      shell: true,
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportJsonPath },
    }
  );

  const durationMs = Date.now() - startTime;
  logger.info(CONTEXT, `Tests completed in ${durationMs}ms`);

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  // Parse the Playwright JSON output
  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failedTests: FailedTest[] = [];

  if (fs.existsSync(reportJsonPath)) {
    try {
      const pwResult = readJson<PlaywrightJsonResult>(reportJsonPath);
      totalTests = (pwResult.stats?.expected ?? 0) + (pwResult.stats?.unexpected ?? 0) + (pwResult.stats?.skipped ?? 0);
      passed = pwResult.stats?.expected ?? 0;
      failed = pwResult.stats?.unexpected ?? 0;
      skipped = pwResult.stats?.skipped ?? 0;

      collectFailures(pwResult.suites ?? [], failedTests);
    } catch (parseErr) {
      logger.warn(CONTEXT, `Could not parse Playwright JSON report: ${(parseErr as Error).message}`);
    }
  } else {
    logger.warn(CONTEXT, 'Playwright JSON report not found — using exit code fallback.');
    failed = result.status !== 0 ? 1 : 0;
    passed = result.status === 0 ? 1 : 0;
    totalTests = 1;
  }

  const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 100 * 10) / 10 : 0;
  const status: ExecutionSummary['status'] =
    failed === 0 ? 'PASS' : passed > 0 ? 'PARTIAL' : 'FAIL';

  const summary: ExecutionSummary = {
    executionId: generateId('exec'),
    timestamp: nowIso(),
    totalTests,
    passed,
    failed,
    skipped,
    passRate,
    durationMs,
    reportPath: reportJsonPath,
    artifactPaths: [path.join(Paths.artifacts, 'test-results')],
    failedTests,
    status,
  };

  writeJson(Paths.executionSummary(), summary);

  logger.success(CONTEXT, `Execution summary written to: ${Paths.executionSummary()}`);
  logger.info(CONTEXT, `  → Total: ${totalTests} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
  logger.info(CONTEXT, `  → Pass Rate: ${passRate}% | Status: ${status}`);

  if (status === 'FAIL') {
    logger.warn(CONTEXT, 'Tests failed — failure analysis will be triggered.');
  }
}

execute().catch((err) => {
  logger.error(CONTEXT, 'Test execution script failed.', err);
  process.exit(1);
});
