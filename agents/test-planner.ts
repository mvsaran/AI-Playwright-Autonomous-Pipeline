/**
 * Test Planner Agent
 * Reads: agents/output/requirement-analysis.json
 * Writes: agents/output/test-plan.json
 */
import { readJson, writeJson, extractAndParseJson } from '../utils/json-utils';
import { callAI } from '../utils/openai-client';
import { readFile, ensureDir } from '../utils/fs-utils';
import { logger } from '../utils/logger';
import { Paths, generateId, nowIso } from '../utils/run-context';
import type { RequirementAnalysis, TestPlan } from '../types/pipeline';

const CONTEXT = 'TestPlanner';

async function plan(): Promise<void> {
  logger.separator('TEST PLANNER AGENT');

  // Load inputs
  const systemPrompt = readFile(`${Paths.prompts}/test-planner.prompt.md`);
  const analysis = readJson<RequirementAnalysis>(Paths.requirementAnalysis());

  logger.info(CONTEXT, `Loaded analysis: ${analysis.analysisId}`);
  logger.info(CONTEXT, `  → ${analysis.userJourneys?.length ?? 0} user journeys to plan`);
  logger.info(CONTEXT, `  → ${analysis.negativeScenarios?.length ?? 0} negative scenarios`);
  logger.info(CONTEXT, `  → ${analysis.edgeCases?.length ?? 0} edge cases`);

  const userPrompt = `
Based on the following requirement analysis, generate a comprehensive test plan with individual test scenarios.

=== REQUIREMENT ANALYSIS ===
${JSON.stringify(analysis, null, 2)}
=== END ANALYSIS ===

Generate a unique planId, use the current timestamp, set sourceAnalysisId to "${analysis.analysisId}", and return ONLY the JSON object.
`.trim();

  logger.info(CONTEXT, 'Sending analysis to AI for test planning...');
  const rawResponse = await callAI(systemPrompt, userPrompt, CONTEXT);

  const plan = extractAndParseJson<TestPlan>(rawResponse, CONTEXT);

  // Ensure required fields
  if (!plan.planId) plan.planId = generateId('plan');
  if (!plan.timestamp) plan.timestamp = nowIso();
  if (!plan.sourceAnalysisId) plan.sourceAnalysisId = analysis.analysisId;
  plan.totalScenarios = plan.scenarios?.length ?? 0;

  ensureDir(Paths.agentsOutput);
  const outputPath = Paths.testPlan();
  writeJson(outputPath, plan);

  logger.success(CONTEXT, `Test plan written to: ${outputPath}`);
  logger.info(CONTEXT, `  → Total Scenarios: ${plan.totalScenarios}`);

  // Print scenario summary by module
  const byModule: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const s of plan.scenarios ?? []) {
    byModule[s.module] = (byModule[s.module] ?? 0) + 1;
    byType[s.testType] = (byType[s.testType] ?? 0) + 1;
  }
  logger.info(CONTEXT, `  → By Module: ${JSON.stringify(byModule)}`);
  logger.info(CONTEXT, `  → By Type:   ${JSON.stringify(byType)}`);
}

plan().catch((err) => {
  logger.error(CONTEXT, 'Test planning failed.', err);
  process.exit(1);
});
