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
import type { FailureAnalysis, FailureType } from '../types/failure';
import { getHealingMemory } from '../utils/db-utils';

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
    return;
  }

  logger.info(CONTEXT, `Analyzing ${summary.failedTests.length} failed test(s) with Healing Memory...`);

  const systemPrompt = readFile(`${Paths.prompts}/failure-analyzer.prompt.md`);

  const enrichedFailures = summary.failedTests.map(f => {
    const memory = getHealingMemory(f.testId);
    return {
      ...f,
      pastHealingAttempts: memory.length,
      lastHealedAt: memory.length > 0 ? memory[memory.length - 1].timestamp : null,
      wasEverHealed: memory.some(m => m.fixApplied)
    };
  });

  const userPrompt = `
Analyze the following Playwright test execution failures. Context from past runs (Healing Memory) is included.

=== EXECUTION SUMMARY WITH MEMORY ===
${JSON.stringify({ ...summary, failedTests: enrichedFailures }, null, 2)}
=== END ===

Return ONLY a JSON failure analysis object.
`.trim();

  const rawResponse = await callAI(systemPrompt, userPrompt, CONTEXT);
  const analysis = extractAndParseJson<FailureAnalysis>(rawResponse, CONTEXT);

  // Fallback for ID, timestamp and execution summary
  analysis.analysisId = analysis.analysisId || generateId('failure-analysis');
  analysis.timestamp = analysis.timestamp || nowIso();
  analysis.sourceExecutionId = summary.executionId;

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

  logger.success(CONTEXT, `Analysis written to: ${Paths.failureAnalysis()}`);
  logger.info(CONTEXT, `  → Failures: ${analysis.summary.totalFailures} | Healable: ${analysis.summary.healableCount}`);
}

analyze().catch((err) => {
  logger.error(CONTEXT, 'Failure analysis failed.', err);
  process.exit(1);
});
