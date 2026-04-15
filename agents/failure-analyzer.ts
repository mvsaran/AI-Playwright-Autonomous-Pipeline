/**
 * Failure Analyzer Agent
 * Reads: agents/output/execution-summary.json
 * Writes: agents/output/failure-analysis.json
 */
import { readJson, writeJson, extractAndParseJson } from '../utils/json-utils';
import { readFile, ensureDir } from '../utils/fs-utils';
import { callAI } from '../utils/openai-client';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import type { ExecutionSummary } from '../types/execution';
import type { FailureAnalysis, FailureSummary, FailureType } from '../types/failure';

const CONTEXT = 'FailureAnalyzer';

async function analyze(): Promise<void> {
  logger.separator('FAILURE ANALYZER AGENT');

  const summary = readJson<ExecutionSummary>(Paths.executionSummary());

  if (summary.failedTests.length === 0) {
    logger.success(CONTEXT, 'No failures to analyze — all tests passed!');

    const emptyAnalysis: FailureAnalysis = {
      analysisId: generateId('failure-analysis'),
      timestamp: nowIso(),
      sourceExecutionId: summary.executionId,
      failures: [],
      summary: {
        totalFailures: 0,
        healableCount: 0,
        probableAppBugs: 0,
        byType: {} as Record<FailureType, number>,
      },
    };

    ensureDir(Paths.agentsOutput);
    writeJson(Paths.failureAnalysis(), emptyAnalysis);
    logger.success(CONTEXT, `Empty failure analysis written to: ${Paths.failureAnalysis()}`);
    return;
  }

  logger.info(CONTEXT, `Analyzing ${summary.failedTests.length} failed test(s)...`);

  const systemPrompt = readFile(`${Paths.prompts}/failure-analyzer.prompt.md`);

  const userPrompt = `
Analyze the following Playwright test execution failures and classify each one.

=== EXECUTION SUMMARY ===
${JSON.stringify(summary, null, 2)}
=== END ===

Generate a unique analysisId, use the current timestamp, and return ONLY the JSON object.
`.trim();

  const rawResponse = await callAI(systemPrompt, userPrompt, CONTEXT);
  const analysis = extractAndParseJson<FailureAnalysis>(rawResponse, CONTEXT);

  // Ensure required fields
  if (!analysis.analysisId) analysis.analysisId = generateId('failure-analysis');
  if (!analysis.timestamp) analysis.timestamp = nowIso();
  if (!analysis.sourceExecutionId) analysis.sourceExecutionId = summary.executionId;

  // Compute summary if AI didn't populate it
  if (!analysis.summary) {
    const byType: Partial<Record<FailureType, number>> = {};
    let healableCount = 0;
    let probableAppBugs = 0;

    for (const f of analysis.failures) {
      byType[f.failureType] = (byType[f.failureType] ?? 0) + 1;
      if (f.healable) healableCount++;
      if (f.failureType === 'probable_app_bug') probableAppBugs++;
    }

    analysis.summary = {
      totalFailures: analysis.failures.length,
      healableCount,
      probableAppBugs,
      byType: byType as Record<FailureType, number>,
    };
  }

  ensureDir(Paths.agentsOutput);
  writeJson(Paths.failureAnalysis(), analysis);

  logger.success(CONTEXT, `Failure analysis written to: ${Paths.failureAnalysis()}`);
  logger.info(CONTEXT, `  → Total Failures: ${analysis.summary.totalFailures}`);
  logger.info(CONTEXT, `  → Healable: ${analysis.summary.healableCount}`);
  logger.info(CONTEXT, `  → Probable App Bugs: ${analysis.summary.probableAppBugs}`);
  logger.info(CONTEXT, `  → By Type: ${JSON.stringify(analysis.summary.byType)}`);
}

analyze().catch((err) => {
  logger.error(CONTEXT, 'Failure analysis failed.', err);
  process.exit(1);
});
